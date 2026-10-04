import { PaymentProvider } from "./PaymentProvider";
import { PeachPaymentProvider } from "./providers/peach";

// Add new providers here as they're built; selection is driven by
// env so it never needs a code change at the call site.
const providers: Record<string, () => PaymentProvider> = {
  peach: () => new PeachPaymentProvider(),
};

export function getPaymentProvider(): PaymentProvider {
  const key = process.env.PAYMENT_PROVIDER ?? "peach";
  const factory = providers[key];
  if (!factory) {
    throw new Error(`Unknown PAYMENT_PROVIDER "${key}"`);
  }
  return factory();
}

export type { PaymentProvider } from "./PaymentProvider";
