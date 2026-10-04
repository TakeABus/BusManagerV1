import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/departures?seasonYear=2026
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const seasonYear = searchParams.get("seasonYear");

  const departures = await prisma.departure.findMany({
    where: seasonYear
      ? { season: { year: Number(seasonYear) } }
      : undefined,
    orderBy: { departsAt: "asc" },
  });

  return NextResponse.json({ departures });
}
