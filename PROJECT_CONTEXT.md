# Project Context

## Purpose
What problem does BusManagerV1 solve, and for whom?

## Scope
What's in scope for v1. What's explicitly out of scope.

## Key Stakeholders
Who this is being built for / with.

## Related Docs
Links to docs/, DECISIONS.md, CHANGELOG.md.

## Data Archaeology
The historical Shopstar export lives at `data/raw/shopstar/` and must not be
modified in place — treat it as read-only source material. Findings from
analysing it (domain model, customer/order/ticket shape) get written up
before database design in `docs/10_DATABASE.md` begins.
