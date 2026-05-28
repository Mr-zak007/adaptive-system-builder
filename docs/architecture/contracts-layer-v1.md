# Contracts Layer v1 (Strict Boundaries)

## 1) Transport Contracts

- DTOs are defined per bounded context under `src/modules/*/contracts`.
- Shared HTTP-level contracts (pagination, filtering, errors, idempotency, optimistic concurrency headers) live under `src/shared/contracts/api`.
- All inbound requests must pass transport schema parsing before entering application services.

## 2) Validation Split

- **Transport validation**: shape, types, lengths, enums, UUID format, optionality.
- **Domain invariants**: lifecycle transitions, ownership rules, policy/authorization checks, forbidden state moves.
- Rule: schemas never embed business decisions that belong to domain invariants.

## 3) Repository Boundaries

- One repository contract per bounded context aggregate root.
- Repositories are persistence-only (load/save/query/projection helpers).
- Forbidden in repositories:
  - lifecycle decisions
  - role checks
  - side-effect orchestration
  - event publishing policies

## 4) Service Boundaries

- **Application services**: command orchestration, transactions, idempotency handling, event emission calls.
- **Domain services**: reusable business rules that are pure and deterministic.
- **Orchestration services**: cross-context workflow coordination through explicit contracts and domain events.

## 5) Background Job Contracts

- Each job has explicit contract: `jobType`, payload schema, timeout, max attempts, retry backoff, dedupe/idempotency key, and dead-letter behavior.
- Event replay safety is mandatory: handlers must be idempotent and safe on duplicate delivery.
- Concurrency limit is defined per job type to avoid hotspot contention.

## 6) Authorization Matrix (Role × Action × Resource)

| Role | Ticket Assign | Task Complete | Solution Publish | Attachment Register | Error Link | Installation Update |
|---|---:|---:|---:|---:|---:|---:|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| dispatcher | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| field_technician | ❌ | ✅ (own tasks) | ❌ | ✅ (task/ticket scope) | ❌ | ✅ (assigned only) |
| support_engineer | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| knowledge_manager | ❌ | ❌ | ✅ | ✅ (knowledge scope) | ✅ | ❌ |
| viewer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## 7) Anti-Patterns Explicitly Forbidden

- Fat services that own unrelated module concerns.
- Generic repositories shared across unrelated bounded contexts.
- Shared utility dumping (`shared util chaos`).
- Direct cross-module table access without service/event boundary.
- Hidden coupling via implicit side effects.