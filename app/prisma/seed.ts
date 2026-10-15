// Seeds two seasons:
//
//  - 2026: the real departures, pricing and round-trip rules from the
//    Parkers Bus Services contract, FAQs and manifests. Sales are already
//    "open" (salesOpensAt is in the past) so the orders route can be tested.
//  - 2027: an empty shell. Prices and salesOpensAt are deliberately null,
//    so nothing can be sold until you set them. Departures are added once
//    the 2027 dates and the Parkers quote are confirmed.
//
// Run with: npx prisma db seed  (or: npx ts-node prisma/seed.ts)

import {
  PrismaClient,
  Direction,
  VehicleType,
  DepartureStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const parkers = await prisma.supplier.create({
    data: { name: "Parkers Bus Services" },
  });

  // ---------------------------------------------------------------- 2026
  const season = await prisma.season.create({
    data: {
      year: 2026,
      eventTheme: "Through The Prism",
      pickupLocation: "Greenpoint Stadium - McDonald's Parking Lot",
      oneWayPriceCents: 130000, // R1,300
      roundTripPriceCents: 240000, // R2,400
      returnOnlyPriceCents: 130000, // R1,300 (the 2025/2026 Return Only price)
      salesOpensAt: new Date("2026-02-15T00:00:00+02:00"),
      ticketChangeCutoff: new Date("2026-04-20T00:00:00Z"),
      paymentHoldMinutes: 60, // card/EFT clear straight away; keep holds short
    },
  });

  const wap = await prisma.departure.create({
    data: {
      seasonId: season.id,
      supplierId: parkers.id,
      code: "WAP",
      label: "WAP Express",
      direction: Direction.INTO_THE_DUST,
      departsAt: new Date("2026-04-24T09:00:00+02:00"),
      restricted: true,
      restrictionNotes: "Work Access Pass holders only",
      vehicleType: VehicleType.BUS_60,
      vehicleCount: 1,
      seatCapacity: 55,
      status: DepartureStatus.CONFIRMED,
    },
  });

  const early = await prisma.departure.create({
    data: {
      seasonId: season.id,
      supplierId: parkers.id,
      code: "EARLY",
      label: "Early Express",
      direction: Direction.INTO_THE_DUST,
      departsAt: new Date("2026-04-27T01:00:00+02:00"),
      vehicleType: VehicleType.BUS_60,
      vehicleCount: 2,
      seatCapacity: 110, // 2 buses
      status: DepartureStatus.CONFIRMED,
    },
  });

  const mid = await prisma.departure.create({
    data: {
      seasonId: season.id,
      supplierId: parkers.id,
      code: "MID",
      label: "Mid Express",
      direction: Direction.INTO_THE_DUST,
      departsAt: new Date("2026-04-29T01:00:00+02:00"),
      vehicleType: VehicleType.BUS_60,
      vehicleCount: 1,
      seatCapacity: 55,
      // The conditional trip: only runs if enough tickets are sold by decideBy.
      // minPassengers is a placeholder until break-even is worked out.
      conditional: true,
      minPassengers: 30,
      decideBy: new Date("2026-04-15T00:00:00+02:00"),
      status: DepartureStatus.PLANNED,
    },
  });

  const returnSun = await prisma.departure.create({
    data: {
      seasonId: season.id,
      supplierId: parkers.id,
      code: "RETURN_SUN",
      label: "Sunday Return",
      direction: Direction.OUT_OF_THE_DUST,
      departsAt: new Date("2026-05-03T13:00:00+02:00"),
      vehicleType: VehicleType.BUS_60,
      vehicleCount: 2,
      seatCapacity: 110, // 2 buses
      status: DepartureStatus.CONFIRMED,
    },
  });

  const returnMon = await prisma.departure.create({
    data: {
      seasonId: season.id,
      supplierId: parkers.id,
      code: "RETURN_MON",
      label: "Monday Return",
      direction: Direction.OUT_OF_THE_DUST,
      departsAt: new Date("2026-05-04T13:00:00+02:00"),
      vehicleType: VehicleType.BUS_60,
      vehicleCount: 1,
      seatCapacity: 55,
      status: DepartureStatus.CONFIRMED,
    },
  });

  // Confirmed valid round-trip combinations.
  // NOTE: no LATE departure seeded yet - confirm with Parkers/LA
  // Tours before adding it.
  await prisma.roundTripOption.createMany({
    data: [
      { inboundId: early.id, outboundId: returnSun.id },
      { inboundId: early.id, outboundId: returnMon.id },
      { inboundId: mid.id, outboundId: returnSun.id },
    ],
  });

  // ---------------------------------------------------------------- 2027
  const season2027 = await prisma.season.create({
    data: {
      year: 2027,
      pickupLocation: "Pinelands Oval",
      // Prices and salesOpensAt stay null on purpose: nothing can be sold
      // until they are set. Planned: sales open 15 Feb 2027.
      paymentHoldMinutes: 60,
    },
  });

  console.log("Seeded 2026 season:", season.id, "(WAP:", wap.id + ")");
  console.log("Seeded empty 2027 season:", season2027.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
