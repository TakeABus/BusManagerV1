import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";

// POST /api/orders
// Body: { seasonId, customerEmail, passengers: [{ name, surname, legs: [{ departureId, ticketKind }] }] }
//
// This is a skeleton — it creates the Order/Passenger/LegBooking
// records and kicks off a Peach checkout, but does not yet enforce
// capacity limits or RoundTripOption validation. Wire those in
// (see src/lib/domain/capacity.ts and roundTrip.ts) before using
// this for real bookings.
export async function POST(request: Request) {
  const body = await request.json();

  const customer = await prisma.customer.upsert({
    where: { email: body.customerEmail },
    update: {},
    create: { email: body.customerEmail },
  });

  const order = await prisma.order.create({
    data: {
      seasonId: body.seasonId,
      customerId: customer.id,
      totalCents: 0, // TODO: compute from season pricing + ticket kinds
      passengers: {
        create: body.passengers.map((p: any) => ({
          name: p.name,
          surname: p.surname,
          legBookings: {
            create: p.legs.map((leg: any) => ({
              departureId: leg.departureId,
              ticketKind: leg.ticketKind,
            })),
          },
        })),
      },
    },
    include: { passengers: { include: { legBookings: true } } },
  });

  const provider = getPaymentProvider();
  // const checkout = await provider.createCheckout({ orderId: order.id, ... });

  return NextResponse.json({ order });
}
