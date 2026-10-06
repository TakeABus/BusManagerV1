import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { countTakenSeats } from "@/lib/domain/seats";
import { isValidRoundTrip } from "@/lib/domain/roundTrip";

// POST /api/orders
//
// Body:
// {
//   seasonId, customerEmail,
//   passengers: [{ name, surname, ticketKind: "ONE_WAY" | "ROUND_TRIP",
//                  departureIds: [one id for ONE_WAY, two for ROUND_TRIP] }]
// }
//
// What this does:
//  - validates the request
//  - works out the price on the server (never trusts the browser)
//  - checks round-trip pairs and seat availability
//  - creates the order as UNPAID and holds the seats for HOLD_MINUTES
//
// NOT done yet: creating the PayFast checkout (see TODO at the bottom).

const HOLD_MINUTES = 15;

class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const OrderBody = z.object({
  seasonId: z.string().min(1),
  customerEmail: z.string().trim().toLowerCase().email(),
  passengers: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        surname: z.string().trim().min(1).max(100),
        ticketKind: z.enum(["ONE_WAY", "ROUND_TRIP"]),
        departureIds: z.array(z.string().min(1)).min(1).max(2),
      })
    )
    .min(1)
    .max(10),
});

export async function POST(request: Request) {
  let body: z.infer<typeof OrderBody>;
  try {
    body = OrderBody.parse(await request.json());
  } catch (e) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: e instanceof z.ZodError ? e.flatten() : undefined,
      },
      { status: 400 }
    );
  }

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        const season = await tx.season.findUnique({
          where: { id: body.seasonId },
        });
        if (!season) throw new BookingError("Unknown season", 404);

        const departureIds = Array.from(
          new Set(body.passengers.flatMap((p) => p.departureIds))
        ).sort();

        // Lock these departure rows until the transaction ends. If two
        // people try to buy the last seat at the same moment, the second
        // one waits here, then sees the seat is gone. Sorted ids avoid
        // deadlocks.
        await tx.$queryRaw`SELECT "id" FROM "Departure" WHERE "id" IN (${Prisma.join(
          departureIds
        )}) ORDER BY "id" FOR UPDATE`;

        const departures = await tx.departure.findMany({
          where: { id: { in: departureIds }, seasonId: season.id },
        });
        if (departures.length !== departureIds.length) {
          throw new BookingError("Unknown departure for this season");
        }
        const byId = new Map<string, (typeof departures)[number]>(
          departures.map((d) => [d.id, d])
        );

        // Restricted departures (e.g. WAP) are not bookable online yet.
        for (const d of departures) {
          if (d.restricted) {
            throw new BookingError(
              `${d.label} is not open for online booking`
            );
          }
        }

        let totalCents = 0;
        const seatsWanted = new Map<string, number>();

        for (const p of body.passengers) {
          const legs = p.departureIds.map((id) => byId.get(id)!);

          if (p.ticketKind === "ONE_WAY") {
            if (legs.length !== 1) {
              throw new BookingError(
                "A one-way ticket needs exactly one departure"
              );
            }
            totalCents += season.oneWayPriceCents;
          } else {
            if (legs.length !== 2) {
              throw new BookingError(
                "A round trip needs exactly two departures"
              );
            }
            const inbound = legs.find((l) => l.direction === "INTO_THE_DUST");
            const outbound = legs.find(
              (l) => l.direction === "OUT_OF_THE_DUST"
            );
            if (!inbound || !outbound) {
              throw new BookingError(
                "A round trip needs one trip in and one trip out"
              );
            }
            const ok = await isValidRoundTrip(inbound.id, outbound.id, tx);
            if (!ok) {
              throw new BookingError(
                `${inbound.label} cannot be combined with ${outbound.label}`
              );
            }
            totalCents += season.roundTripPriceCents;
          }

          for (const l of legs) {
            seatsWanted.set(l.id, (seatsWanted.get(l.id) ?? 0) + 1);
          }
        }

        // Enough seats left on every departure we are about to sell?
        for (const [departureId, wanted] of Array.from(
          seatsWanted.entries()
        )) {
          const dep = byId.get(departureId)!;
          const taken = await countTakenSeats(departureId, tx);
          if (taken + wanted > dep.seatCapacity) {
            throw new BookingError(
              `Not enough seats left on ${dep.label}`,
              409
            );
          }
        }

        const customer = await tx.customer.upsert({
          where: { email: body.customerEmail },
          update: {},
          create: { email: body.customerEmail },
        });

        return tx.order.create({
          data: {
            seasonId: season.id,
            customerId: customer.id,
            totalCents,
            expiresAt: new Date(Date.now() + HOLD_MINUTES * 60 * 1000),
            passengers: {
              create: body.passengers.map((p) => ({
                name: p.name,
                surname: p.surname,
                legBookings: {
                  create: p.departureIds.map((departureId) => ({
                    departureId,
                    ticketKind: p.ticketKind,
                  })),
                },
              })),
            },
          },
        });
      },
      { timeout: 10000 }
    );

    // TODO: create the PayFast checkout here, using order.id as the
    // payment reference and order.totalCents as the amount, then return
    // the redirect details to the browser.

    return NextResponse.json(
      {
        orderId: order.id,
        totalCents: order.totalCents,
        expiresAt: order.expiresAt,
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof BookingError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("Order creation failed:", e);
    return NextResponse.json(
      { error: "Something went wrong creating the order" },
      { status: 500 }
    );
  }
}