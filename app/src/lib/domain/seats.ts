import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// A seat counts as "taken" when its order is PAID, or when it is
// UNPAID but still inside its hold window (Order.expiresAt is in the
// future). An abandoned checkout stops counting once its hold runs
// out, so no clean-up job is needed.
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
      passenger: {
        order: {
          OR: [
            { paymentStatus: "PAID" },
            { paymentStatus: "UNPAID", expiresAt: { gt: new Date() } },
          ],
        },
      },
    },
  });
}