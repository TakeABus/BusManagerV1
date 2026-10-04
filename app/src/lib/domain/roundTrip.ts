import { prisma } from "@/lib/db";

// Round trips are not "any inbound + any outbound" — only specific
// pairs are valid per season (see RoundTripOption in schema.prisma,
// and the confirmed rule: EARLY->Wed/Fri/Sun, MID->Fri/Sun,
// LATE->Sun only). Always validate through this helper rather than
// letting the booking flow accept an arbitrary pair.
export async function isValidRoundTrip(
  inboundDepartureId: string,
  outboundDepartureId: string
) {
  const match = await prisma.roundTripOption.findUnique({
    where: {
      inboundId_outboundId: {
        inboundId: inboundDepartureId,
        outboundId: outboundDepartureId,
      },
    },
  });
  return Boolean(match);
}
