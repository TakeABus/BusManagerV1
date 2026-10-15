import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { countTakenSeats } from "@/lib/domain/seats";
import { isValidRoundTrip } from "@/lib/domain/roundTrip";
import { ticketHash } from "@/lib/domain/ticketHash";

// POST /api/orders
//
// Body:
// {
//   seasonId, customerEmail,
//   passengers: [{ name, surname,
//                  ticketKind: "ONE_WAY" | "ROUND_TRIP" | "RETURN_ONLY",
//                  departureIds: [one id for ONE_WAY / RETURN_ONLY,
//                                 two ids for ROUND_TRIP] }]
// }
//
// What this does:
//  - refuses to sell before Season.salesOpensAt, or if the price is not set
//  - validates the request and works out the price on the server
//  - checks round-trip pairs and seat availability
//  - creates the Order, one Ticket per passenger (with its legs and QR hash)
//    and one Payment, all PENDING_PAYMENT, and holds the seats until
//    Season.paymentHoldMinutes have passed
//
// NOT done yet: creating the PayFast checkout (see TODO at the bottom).

class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

type TicketKind = "ONE_WAY" | "ROUND_TRIP" | "RETURN_ONLY";

const OrderBody = z.object({
  seasonId: z.string().min(1),
  customerEmail: z.string().trim().toLowerCase().email(),
  passengers: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        surname: z.string().trim().min(1).max(100),
        ticketKind: z.enum(["ONE_WAY", "ROUND_TRIP", "RETURN_ONLY"]),
        departureIds: z.array(z.string().min(1)).min(1).max(2),
      })
    )
    .min(1)
    .max(10),
});

type PreparedTicket = {
  id: string;
  kind: TicketKind;
  priceCents: number;
  name: string;
  surname: string;
  departureIds: string[];
};

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
    const result = await prisma.$transaction(
      async (tx) => {
        const season = await tx.season.findUnique({
          where: { id: body.seasonId },
        });
        if (!season) throw new BookingError("Unknown season", 404);

        // Sales gate: closed until salesOpensAt has passed.
        if (!season.salesOpensAt || season.salesOpensAt > new Date()) {
          throw new BookingError("Ticket sales are not open yet", 403);
        }

        const priceFor = (kind: TicketKind): number => {
          const price =
            kind === "ONE_WAY"
              ? season.oneWayPriceCents
              : kind === "ROUND_TRIP"
                ? season.roundTripPriceCents
                : season.returnOnlyPriceCents;
          if (price === null || price === undefined) {
            throw new BookingError(
              "This ticket type is not on sale yet",
              409
            );
          }
          return price;
        };

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

        for (const d of departures) {
          // Restricted departures (e.g. WAP) are not bookable online yet.
          if (d.restricted) {
            throw new BookingError(
              `${d.label} is not open for online booking`
            );
          }
          // A cancelled departure can never be sold.
          if (d.status === "CANCELLED") {
            throw new BookingError(`${d.label} has been cancelled`, 409);
          }
        }

        let totalCents = 0;
        const seatsWanted = new Map<string, number>();
        const prepared: PreparedTicket[] = [];

        for (const p of body.passengers) {
          const legs = p.departureIds.map((id) => byId.get(id)!);

          if (p.ticketKind === "ONE_WAY") {
            if (legs.length !== 1) {
              throw new BookingError(
                "A one-way ticket needs exactly one departure"
              );
            }
            if (legs[0].direction !== "INTO_THE_DUST") {
              throw new BookingError(
                "A one-way ticket is for a trip into the dust. Use Return Only for a trip home."
              );
            }
          } else if (p.ticketKind === "RETURN_ONLY") {
            if (legs.length !== 1) {
              throw new BookingError(
                "A return-only ticket needs exactly one departure"
              );
            }
            if (legs[0].direction !== "OUT_OF_THE_DUST") {
              throw new BookingError(
                "A return-only ticket is for a trip out of the dust"
              );
            }
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
          }

          const priceCents = priceFor(p.ticketKind);
          totalCents += priceCents;

          prepared.push({
            id: randomUUID(),
            kind: p.ticketKind,
            priceCents,
            name: p.name,
            surname: p.surname,
            departureIds: p.departureIds,
          });

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

        const holdExpiresAt = new Date(
          Date.now() + season.paymentHoldMinutes * 60 * 1000
        );

        const order = await tx.order.create({
          data: {
            seasonId: season.id,
            customerId: customer.id,
            totalCents,
            tickets: {
              create: prepared.map((t) => ({
                id: t.id,
                kind: t.kind,
                source: "PURCHASED" as const,
                status: "PENDING_PAYMENT" as const,
                priceCents: t.priceCents,
                holdExpiresAt,
                qrHash: ticketHash(t.id, 1),
                holder: { create: { name: t.name, surname: t.surname } },
                legs: {
                  create: t.departureIds.map((departureId) => ({
                    departureId,
                  })),
                },
              })),
            },
          },
        });

        // One Payment covers the whole order. (Bulk orders where each rider
        // pays their own link will create one Payment per ticket instead.)
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            provider: process.env.PAYMENT_PROVIDER ?? "payfast",
            amountCents: totalCents,
            status: "PENDING",
            expiresAt: holdExpiresAt,
          },
        });

        await tx.ticket.updateMany({
          where: { orderId: order.id },
          data: { paymentId: payment.id },
        });

        return { order, payment };
      },
      { timeout: 10000 }
    );

    // TODO: create the PayFast checkout here, using result.payment.id as
    // the payment reference and result.payment.amountCents as the amount,
    // then save the checkout details on the Payment and return the
    // redirect details to the browser.

    return NextResponse.json(
      {
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        paymentId: result.payment.id,
        totalCents: result.order.totalCents,
        expiresAt: result.payment.expiresAt,
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
