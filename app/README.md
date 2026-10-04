# BusManagerV1 — App Starter

Base code structure for the Take A Bus To AfrikaBurn ticketing/resale
system. Matches the confirmed decisions in the main repo's
`DECISIONS.md`: PostgreSQL as the database, Peach Payments as the
first payment integration behind a swappable abstraction.

This is a **starting skeleton**, not a finished app — most routes and
UI are stubs with TODOs marking where real logic goes.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma** ORM against **PostgreSQL**
- Payment handling isolated behind `src/lib/payments/PaymentProvider.ts`,
  with a `PeachPaymentProvider` stub implementation

## Project layout

```
prisma/
  schema.prisma     # the full domain model (Season, Departure,
                     # Order, Passenger, LegBooking, etc.) — see the
                     # comments at the top of the file for the design
  seed.ts            # seeds a 2026 season with real confirmed data

src/
  app/
    page.tsx          # placeholder homepage
    layout.tsx
    api/
      departures/      # GET departures for a season
      orders/          # POST create an order (skeleton — no
                       # capacity/round-trip validation wired in yet)
      payments/webhook/ # receives payment confirmation
  lib/
    db.ts              # Prisma client singleton
    payments/          # PaymentProvider abstraction + Peach stub
    domain/
      capacity.ts       # seat capacity, return-demand forecasting,
                        # unpaired-departure detection
      roundTrip.ts      # validates inbound/outbound combinations
                        # against RoundTripOption (not "any + any")
```

## Why the schema looks the way it does

Everything in `prisma/schema.prisma` traces back to something
confirmed from real data, not assumptions:

- **Season** exists because pickup location, pricing, and even which
  departures run at all change every year.
- **Order -> Passenger -> LegBooking** (rather than just Order ->
  Ticket) exists because real manifests showed a single order can
  carry multiple passengers with *different* itineraries, and a
  round-trip passenger generates two separate bookings (one per leg).
- **RoundTripOption** exists because return days are NOT freely
  combinable — confirmed rule: Early returns Wed/Fri/Sun, Mid returns
  Fri/Sun, Late returns Sun only.
- **`LegBooking.dateChangesUsed`** exists for the confirmed "one date
  change only, before 20 April" rule.
- **Unpaid orders don't hold a seat** — capacity helpers in
  `domain/capacity.ts` only count `PAID` orders. ~14-23% of order
  attempts historically never convert, so holding seats for them
  would waste real capacity. (Flagged as an assumption to confirm.)

## Getting started

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL at minimum
npx prisma migrate dev --name init
npx prisma db seed       # or: npx ts-node prisma/seed.ts
npm run dev
```

## Not yet built (by design — this is a starting point)

- Capacity/round-trip validation is NOT yet wired into the
  `/api/orders` POST handler — it creates bookings without checking
  `getDepartureCapacity()` or `isValidRoundTrip()` first. Wire those
  in before using this for real bookings.
- Real Peach Payments API calls (`createCheckout` / `verifyPayment`
  are stubs that throw).
- No UI beyond a placeholder homepage.
- No auth/admin area yet.
- Resale/transfer flow (`LegBooking.transferStatus`) has schema
  support but no API/UI yet.
