// Confirmed decision (DECISIONS.md): Peach Payments is the first
// integration, but it must sit behind this abstraction so a future
// provider can be added without touching order/checkout logic.

export interface CreateCheckoutInput {
  orderId: string;
  amountCents: number;
  currency: string; // "ZAR"
  customerEmail: string;
}

export interface CreateCheckoutResult {
  checkoutId: string;
  redirectUrl: string; // where the customer completes payment
}

export interface VerifyPaymentResult {
  success: boolean;
  providerRef: string;
  amountCents: number;
  raw: unknown; // original provider payload, for auditing
}

export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyPayment(checkoutId: string): Promise<VerifyPaymentResult>;
}
