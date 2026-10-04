// Seeds a 2026 Season with the real departures/pricing/round-trip
// rules confirmed from the Parkers Bus Services contract, FAQs and
// manifests. Adjust dates/capacity as you confirm final 2026 details
// (e.g. whether LATE Express is running, and which supplier covers it).
//
// Run with: npx ts-node prisma/seed.ts  (or wire into package.json)

import { PrismaClient, Direction } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const season = await prisma.season.create({
    data: {
      year: 2026,
      eventTheme: "Through The Prism",
      pickupLocation: "Greenpoint Stadium - McDonald's Parking Lot",
      oneWayPriceCents: 130000, // R1,300
      roundTripPriceCents: 240000, // R2,400
      ticketChangeCutoff: new Date("2026-04-20T00:00:00Z"),
    },
  });

  const parkers = await prisma.supplier.create({
    data: { name: "Parkers Bus Services" },
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
      seatCapacity: 55,
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
      seatCapacity: 110, // 2 buses
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
      seatCapacity: 55,
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
      seatCapacity: 110, // 2 buses
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
      seatCapacity: 55,
    },
  });

  // Confirmed valid round-trip combinations.
  // NOTE: no LATE departure seeded yet — confirm with Parkers/LA
  // Tours before adding it (see take-a-bus.md open questions).
  await prisma.roundTripOption.createMany({
    data: [
      { inboundId: early.id, outboundId: returnSun.id },
      { inboundId: early.id, outboundId: returnMon.id },
      { inboundId: mid.id, outboundId: returnSun.id },
    ],
  });

  console.log("Seeded 2026 season:", season.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
