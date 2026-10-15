import { PaymentProvider } from "./PaymentProvider";
import { FakePaymentProvider } from "./providers/fake";

// Add new providers here as they're built; selection is driven by
// env so it never needs a code change at the call site.
const providers: Record<string, () => PaymentProvider> = {
  fake: () => new FakePaymentProvider(),
  // yoco: () => new YocoPaymentProvider(),
  // paystack: () => new PaystackPaymentProvider(),
};

export function getPaymentProvider(): PaymentProvider {
  const key = process.env.PAYMENT_PROVIDER;
  if (!key) {
    throw new Error("PAYMENT_PROVIDER is not set");
  }
  const factory = providers[key];
  if (!factory) {
    throw new Error(`Unknown PAYMENT_PROVIDER "${key}"`);
  }
  return factory();
}

export type { PaymentProvider } from "./PaymentProvider";
