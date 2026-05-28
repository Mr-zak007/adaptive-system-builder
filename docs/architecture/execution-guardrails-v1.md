# Execution Guardrails v1 (Pre-Adapter)

## 1) Server Function Rule

Server functions are **use-cases only**; no generic CRUD endpoints.

Allowed examples:
- `assignTicket()`
- `resolveTicket()`
- `scheduleFieldTask()`
- `publishSolution()`
- `attachErrorCode()`

Forbidden:
- `createTicket()`
- `updateTicket()`
- `genericSave()`

## 2) Business Logic Placement

Business logic is allowed only in:
- domain services
- application services

Business logic is forbidden in:
- adapters
- repositories
- server functions
- validators

## 3) Transaction Boundaries (mandatory)

- `ticket assignment`: ticket update + ticket_event + outbox event + audit in one transaction.
- `task completion`: task transition + outbox + audit in one transaction.
- `attachment linking`: attachment metadata + outbox + audit in one transaction.
- `solution publishing`: solution publish state + outbox + audit in one transaction.
- `escalation`: timer transition + escalation event + audit in one transaction.

## 4) Idempotency + Concurrency

- Sensitive commands require idempotency key and request hash checks.
- `row_version` enforced via conditional updates (`WHERE id = ? AND row_version = ?`).
- Version mismatch returns explicit conflict contract.
- Background jobs are replay-safe and idempotent by `dedupe_key`.

## 5) Event Emission Discipline

- No event emission outside use-case transaction path.
- Every emitted event must have deterministic payload from committed state.
- Outbox dedupe prevents duplicate events.
- No hidden side effects in event handlers.

## 6) Boundary Safety Rules

- No generic repositories.
- No cross-module direct service call unless through explicit orchestration contract.
- No shared mutable utilities.
- No circular dependencies between modules.
- No fat orchestrators; each orchestrator owns one workflow boundary.

## 7) DTO Mapping Rule

- Always map application/domain output to transport DTO through explicit mapper.
- Never return DB/repository records directly from transport layer.