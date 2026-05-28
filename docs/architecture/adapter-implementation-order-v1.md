# Adapter Implementation Order (Strict)

## Phase 1 — Infrastructure adapters (no business logic)

1. TransactionManager adapter
2. IdempotencyStore adapter
3. DomainOutbox adapter
4. Per-module repositories (Ticket, Task, Attachment, Knowledge, ErrorIntelligence)

## Phase 2 — Server function wiring (use-cases only)

Wire only:
- `assignTicket`
- `resolveTicket`
- `scheduleFieldTask`
- `publishSolution`
- `attachErrorCode`

No generic CRUD server function is allowed.

## Phase 3 — Vertical slice execution

Implement and test one full slice:
`Ticket -> Assignment -> Field Task -> Attachment -> Resolution -> Audit/Event`

## Non-negotiable guardrails

- no business logic in adapters/repositories/server functions/validators
- no cross-module direct DB access
- no circular dependency introduction
- no fat orchestrator beyond slice boundary