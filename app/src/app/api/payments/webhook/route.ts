import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/payments/webhook
// Receives payment confirmation from the active PaymentProvider.
// Marking an order PAID is the moment a LegBooking actually counts
// against departure capacity (see DECISIONS.md: unpaid orders do
// not hold a seat).
export async function POST(request: Request) {
  const payload = await request.json();

  // TODO: verify signature/authenticity per provider, then:
  // await prisma.order.update({
  //   where: { id: payload.orderId },
  //   data: { paymentStatus: "PAID", paidAt: new Date(), providerRef: payload.ref },
  // });

  return NextResponse.json({ received: true });
}
