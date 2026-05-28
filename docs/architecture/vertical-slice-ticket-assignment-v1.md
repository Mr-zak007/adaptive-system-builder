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

## Stress validation extensions (v1.1)

- **Concurrency stress**
  - simultaneous assignment attempts
  - concurrent task updates
  - repeated retries with duplicate idempotency keys
  - stale `row_version` conflict pressure
  - expected behavior: optimistic concurrency rejects stale writers (no hidden overwrites)

- **Event/Outbox stress**
  - duplicate replay prevention
  - delayed processing + partial delivery simulation
  - retry storm simulation with bounded retries
  - ordering guarantee check via monotonic outbox sequence
  - expected behavior: side effects do not duplicate, state remains consistent

- **Attachment lifecycle stress**
  - orphan prevention
  - failed upload rejection before persistence
  - MIME spoofing rejection
  - checksum format validation
  - large-attachment guardrails

- **Transaction boundaries (explicit)**
  - start: command/use-case boundary
  - inside transaction only: aggregate write, immutable event append, audit append, outbox enqueue
  - outside transaction (async): outbox delivery, retries, external side effects

- **Architectural fitness automation**
  - cross-module import boundary checks
  - repository leakage checks
  - DTO/transport boundary checks
  - domain bypass checks
  - direct DB access outside infrastructure checks

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