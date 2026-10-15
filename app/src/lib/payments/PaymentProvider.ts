// Every payment gateway sits behind this interface so a provider can be
// added or swapped without touching order, ticket or resale logic.
// The first provider is still to be chosen (Yoco and Paystack are the
// shortlist; Peach has paused onboarding, PayFast was ruled out).
//
// Our own record of a checkout attempt is the Payment table. Its id is
// what we give the gateway as the reference, and the gateway's own id
// is stored in Payment.providerRef.

export interface CreateCheckoutInput {
  paymentId: string; // our Payment.id, used as the gateway's reference
  amountCents: number;
  currency: string; // "ZAR"
  customerEmail: string;
  description?: string; // e.g. "Take A Bus 2027 - order 1042"
  expiresAt?: Date; // when the seat hold ends
}

export interface CreateCheckoutResult {
  providerRef: string; // the gateway's id for this checkout
  redirectUrl: string; // where the customer completes payment
}

export interface VerifyPaymentResult {
  success: boolean;
  providerRef: string;
  amountCents: number;
  raw: unknown; // original provider payload, for auditing
}

// What a verified webhook notification boils down to. The route stores
// every one in PaymentEvent (unique on provider + eventId) so repeated
// or out-of-order notifications cannot be processed twice.
export interface WebhookEvent {
  eventId: string; // the gateway's unique id for this notification
  paymentId: string | null; // our Payment.id, if the gateway echoes it back
  providerRef: string | null;
  paid: boolean;
  amountCents: number | null;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string; // stored in Payment.provider, e.g. "yoco"
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  verifyPayment(providerRef: string): Promise<VerifyPaymentResult>;
  // Check the signature on a webhook request and return a normalised event.
  // Must throw if the signature is missing or wrong.
  parseWebhook(
    rawBody: string,
    headers: Record<string, string>
  ): Promise<WebhookEvent>;
}
