import { prisma } from "@/lib/db";
import type {
  PaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutResult,
  VerifyPaymentResult,
  WebhookEvent,
} from "../PaymentProvider";

// Development and demo only. Never usable in production.
export class FakePaymentProvider implements PaymentProvider {
  readonly name = "fake";

  constructor() {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FakePaymentProvider cannot be used in production");
    }
  }

  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    return {
      providerRef: `fake_${input.paymentId}`,
      redirectUrl: `/pay/fake/${input.paymentId}`, // demo page, built later
    };
  }

  async verifyPayment(providerRef: string): Promise<VerifyPaymentResult> {
    const paymentId = providerRef.replace(/^fake_/, "");
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    return {
      success: !!payment,
      providerRef,
      amountCents: payment?.amountCents ?? 0,
      raw: { fake: true },
    };
  }

  async parseWebhook(rawBody: string): Promise<WebhookEvent> {
    const body = JSON.parse(rawBody);
    return {
      eventId: String(body.eventId),
      paymentId: body.paymentId ?? null,
      providerRef: body.paymentId ? `fake_${body.paymentId}` : null,
      paid: body.paid === true,
      amountCents: body.amountCents ?? null,
      raw: body,
    };
  }
}
