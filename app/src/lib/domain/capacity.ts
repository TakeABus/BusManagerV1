import { prisma } from "@/lib/db";

// How many seats are currently booked (paid LegBookings) on a
// departure, vs how many remain.
export async function getDepartureCapacity(departureId: string) {
  const departure = await prisma.departure.findUniqueOrThrow({
    where: { id: departureId },
    include: {
      legBookings: {
        where: { passenger: { order: { paymentStatus: "PAID" } } },
      },
    },
  });

  const booked = departure.legBookings.length;
  return {
    departureId,
    seatCapacity: departure.seatCapacity,
    booked,
    remaining: departure.seatCapacity - booked,
  };
}

// Mirrors the manual "return demand" calculation seen in the
// pre-app spreadsheet process: everyone still on-site whose return
// leg is this departure, plus anyone who bought a one-way-out
// ticket for this departure directly.
export async function getReturnDemand(outboundDepartureId: string) {
  const bookings = await prisma.legBooking.findMany({
    where: {
      departureId: outboundDepartureId,
      passenger: { order: { paymentStatus: "PAID" } },
    },
  });

  return {
    departureId: outboundDepartureId,
    totalReturnDemand: bookings.length,
  };
}

// A departure with inbound passengers but no corresponding outbound
// leg booked anywhere is an "empty return" risk — flagged manually
// today (see the MID Express / Tulbagh-Wolseley repositioning case).
export async function findUnpairedInboundDepartures(seasonId: string) {
  const inboundDepartures = await prisma.departure.findMany({
    where: { seasonId, direction: "INTO_THE_DUST" },
    include: { roundTripOptionsAsInbound: true },
  });

  return inboundDepartures.filter(
    (d) => d.roundTripOptionsAsInbound.length === 0
  );
}
