import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// A seat counts as "taken" when its ticket is:
//  - ACTIVE (paid, comped, or recorded as paid directly), or
//  - LISTED_FOR_RESALE (the seller still holds it until someone buys it), or
//  - PENDING_PAYMENT but still inside its hold window (holdExpiresAt is in
//    the future).
// An abandoned checkout stops counting once its hold runs out, so no
// clean-up job is needed. EXPIRED tickets never count.
//
// Pass `tx` when calling from inside a prisma.$transaction so the
// count sees the same data the transaction is working with.
export async function countTakenSeats(
  departureId: string,
  db: Prisma.TransactionClient = prisma
) {
  return db.legBooking.count({
    where: {
      departureId,
      ticket: {
        OR: [
          { status: { in: ["ACTIVE", "LISTED_FOR_RESALE"] } },
          { status: "PENDING_PAYMENT", holdExpiresAt: { gt: new Date() } },
        ],
      },
    },
  });
}
