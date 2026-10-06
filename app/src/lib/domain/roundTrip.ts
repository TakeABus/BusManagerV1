import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// Round trips are not "any inbound + any outbound" — only specific
// pairs are valid per season (see RoundTripOption in schema.prisma).
// Always validate through this helper rather than letting the
// booking flow accept an arbitrary pair.
//
// Pass `tx` when calling from inside a prisma.$transaction.
export async function isValidRoundTrip(
  inboundDepartureId: string,
  outboundDepartureId: string,
  db: Prisma.TransactionClient = prisma
) {
  const match = await db.roundTripOption.findUnique({
    where: {
      inboundId_outboundId: {
        inboundId: inboundDepartureId,
        outboundId: outboundDepartureId,
      },
    },
  });
  return Boolean(match);
}