# Repository & Service Boundaries v1

## Repository Contracts (Persistence Only)

- `TicketRepository`: ticket aggregate persistence + immutable event append.
- `TaskRepository`: task state persistence and row-version updates.
- `KnowledgeRepository`: article/solution/procedure persistence only.
- `ErrorIntelligenceRepository`: error-link persistence and read queries.
- `AttachmentRepository`: metadata persistence and lifecycle status updates.

### Hard Rules
- No business logic in repositories.
- No authorization checks in repositories.
- No cross-module direct table operations.

## Service Layers

- **Application services**
  - validate transport contracts
  - enforce idempotency + optimistic concurrency flow
  - call domain invariants
  - persist using own-module repository
  - publish domain events

- **Domain services**
  - pure business rules only
  - deterministic and side-effect free

- **Orchestration services**
  - cross-module flow coordination
  - integration via application-service contracts/events only
  - no persistence bypass

## Background Job Boundaries

- Job registration is contract-first (`jobType`, schema, retry/dead-letter/timeout/concurrency).
- Handlers are idempotent and replay-safe.
- Dead-letter is terminal state; recovery uses explicit replay command.