import {
  PaymentProvider,
  CreateCheckoutInput,
  CreateCheckoutResult,
  VerifyPaymentResult,
} from "../PaymentProvider";

// Minimal stub — wire up real Peach Payments (OPPWA) API calls here.
// Docs: https://peachpayments.docs.oppwa.com/
export class PeachPaymentProvider implements PaymentProvider {
  readonly name = "peach";

  private entityId = process.env.PEACH_ENTITY_ID ?? "";
  private accessToken = process.env.PEACH_ACCESS_TOKEN ?? "";
  private baseUrl = process.env.PEACH_BASE_URL ?? "https://eu-test.oppwa.com";

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutResult> {
    // TODO: POST to Peach /v1/checkouts with entityId/accessToken,
    // amount, currency, and a merchantTransactionId = input.orderId.
    throw new Error("PeachPaymentProvider.createCheckout not implemented yet");
  }

  async verifyPayment(checkoutId: string): Promise<VerifyPaymentResult> {
    // TODO: GET /v1/checkouts/{id}/payment and check result.code
    // against Peach's success regex.
    throw new Error("PeachPaymentProvider.verifyPayment not implemented yet");
  }
}
