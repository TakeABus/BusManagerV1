# Decisions Log

This is the single source of truth for confirmed architectural and product
decisions on Take A Bus. When Claude, Codex, or anyone else is unsure whether
something has been decided, check here first — don't assume, don't re-decide,
and don't let one AI convince another that something was settled when it wasn't.

Record decisions newest first. Use the template below.

---

## 2026-09-21 — Primary relational database

**Decision:** Use PostgreSQL as the primary relational database.

**Reason:** Ticket ownership, orders, payments, trips and resale relationships
are strongly relational and require transactional consistency.

**Status:** CONFIRMED

---

## 2026-09-21 — First payment integration

**Decision:** Peach will be the first payment integration.

**Status:** CONFIRMED FOR MVP

**Important:** A `PaymentProvider` abstraction remains mandatory — Peach must
not be hard-wired into core ticketing/order logic. Any future provider
(Stripe, PayFast, etc.) should be addable without touching business rules.

---

## Template

### YYYY-MM-DD — Decision title
**Context:** Why this decision was needed.
**Decision:** What was decided.
**Alternatives considered:** What else was on the table.
**Consequences:** Tradeoffs, follow-up work.
**Status:** PROPOSED / CONFIRMED / CONFIRMED FOR MVP / SUPERSEDED
