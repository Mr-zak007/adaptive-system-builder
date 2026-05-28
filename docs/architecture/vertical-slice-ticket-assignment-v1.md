# Vertical Slice v1: Ticket → Assignment → Field Task → Attachment → Resolution

## Goal

Validate real architectural correctness with one end-to-end workflow before broad expansion.

## Use-case path (strict)

1. `assignTicket()`
2. `scheduleFieldTask()`
3. `registerAttachment()` on task/ticket
4. `completeTask()`
5. `resolveTicket()`
6. audit + outbox/domain events verified

## Transaction checkpoints

- Assignment transaction:
  - ticket conditional update (`row_version`)
  - ticket event append
  - outbox append once
  - audit append

- Task scheduling/completion transaction:
  - task state write
  - outbox append once
  - audit append

- Resolution transaction:
  - ticket status conditional update
  - ticket event append
  - outbox append once
  - audit append

## Correctness assertions

- Duplicate `Idempotency-Key` replays response and does not duplicate writes/events.
- Wrong `ifMatchVersion` returns `VERSION_CONFLICT` and commits nothing.
- Event payloads are deterministic and match committed state.
- `ticket_events` history is immutable and complete for transitions.
- No repository crosses bounded context ownership.

## Out of scope for this slice

- dashboards/UI
- advanced analytics and read-model expansion
- multi-slice orchestration

## Validation Harness Contract

- Server function: `validateTicketLifecycleVerticalSlice`
- Request DTO: `verticalSliceValidationRequestSchema`
- Response DTO: `verticalSliceValidationResponseSchema`
- Execution mode (current): in-memory architecture harness for deterministic behavioral validation
- Next mode: swap to DB-backed adapters with the same contract for production-grade verification