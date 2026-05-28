# System Foundation v1

## 1) Module Boundaries (Modular Monolith)

### Core bounded contexts
- **identity-access**: authentication integration, RBAC, permission checks, org scoping.
- **catalog**: product catalog models/specifications (design-time definitions only).
- **asset-registry**: solar systems + installed components (field instances).
- **ticketing**: ticket lifecycle, assignment, state transitions, comments/events.
- **field-service**: field tasks, technician workflow, completion events.
- **error-intelligence**: error codes, mapping, confidence/rules metadata.
- **knowledge**: knowledge articles, proven solutions, troubleshooting procedures.
- **attachments**: attachment abstraction, lifecycle, storage provider adapter.
- **installations**: installation projects/tasks and handover to asset-registry.
- **sla-engine**: response/escalation/overdue timers and breach events.
- **jobs-orchestration**: background jobs, retries, dead-letter, job metrics.
- **audit-observability**: immutable audit trail + domain event outbox.
- **reporting**: read models/materialized views + analytics exports.

### Rules between modules
- No direct DB access across bounded contexts.
- Cross-context interactions happen via:
  1. internal application service contract, or
  2. internal domain event (`domain_events` table/outbox).
- UI/API layer never bypasses application services.

## 2) Product Catalog vs Installed Components (Hard Separation)

- `product_catalog_models`: canonical product definitions (SKU, vendor, specs, firmware baseline).
- `installed_components`: field instances bound to a `solar_system_id` and optionally `catalog_model_id`.
- Instance-only fields (serial number, install date, runtime telemetry pointers, health status) live only in `installed_components`.
- No solar system runtime state is stored in catalog tables.

## 3) Concurrency & Consistency Strategy

- **Optimistic locking** on mutable entities using `row_version`.
  - Update contract: `WHERE id = :id AND row_version = :expected_version`.
  - On success: increment `row_version = row_version + 1`.
  - On conflict: return `409 CONFLICT` with latest server snapshot.
- **Idempotency** for sensitive operations via `operation_idempotency`.
  - Unique key: `(org_id, operation_type, idempotency_key)`.
  - Stores request hash + response hash + status.
- **Transactional boundaries**:
  - state transition + ticket_event + audit_log + domain_event are committed in one transaction.

## 4) Attachment Abstraction Strategy

- `attachments` is standalone and polymorphic:
  - `owner_type`
  - `owner_id`
  - `storage_provider`
  - `storage_key`
  - `mime_type`, `checksum_sha256`, `size_bytes`
- Lifecycle via `attachment_status`:
  - `uploaded` -> `processing` -> (`ready` | `failed`) -> `deleted`
- Provider abstraction through adapter interface in application layer:
  - `StorageProviderAdapter.put/get/delete/signUrl/exists`
- Heavy-media handling:
  - async processing jobs (thumb/transcode/OCR/virus scan)
  - chunked uploads + signed URLs
  - strict limits by MIME category and size

## 5) Background Jobs & Retry Policy

- `job_executions` for runtime and retries:
  - exponential backoff with jitter
  - `max_attempts` per job type
  - dead-letter state after terminal failure
- Idempotent job handlers mandatory for:
  - ticket assignment projections
  - task completion projections
  - media processing
  - SLA escalation checks
- `next_run_at` + `locked_at` + `locked_by` prevent double processing.

## 6) SLA Architecture (Extensible)

- `sla_policies` defines SLA templates per priority/contract tier.
- `ticket_sla_timers` supports multiple timers per ticket:
  - `response`
  - `escalation`
  - `overdue`
- Timer state machine:
  - `pending` -> `running` -> (`met` | `breached` | `canceled`)
- Escalation and breach emit domain events for notification/reporting modules.

## 7) Search, Pagination, Filtering & Query Performance

### Search
- MVP: Postgres full-text (`tsvector`) + trigram indexes.
- Search scopes split by bounded context (ticketing, knowledge, error intelligence).

### Pagination
- Default: **cursor pagination** for high-volume lists (`created_at, id`).
- Offset pagination only for admin low-volume pages.

### Filtering
- Filter DTO per module (strict allowlist).
- Compound indexes aligned with common filters (status + assignee + updated_at, etc.).

### Reporting scalability
- Pre-aggregated read models/materialized views for historical analytics.
- Background refresh jobs; no heavy aggregation on user-request path.

## 8) Immutable Audit Logs

- `audit_logs` append-only only.
- DB triggers reject UPDATE/DELETE on audit rows.
- audit records include:
  - actor, action, entity_type, entity_id
  - before_data / after_data
  - request_id, correlation_id
  - created_at

## 9) Suggested Folder Structure

```text
src/
  modules/
    identity-access/
      domain/
      application/
      infrastructure/
      contracts/
    catalog/
      domain/
      application/
      infrastructure/
      contracts/
    asset-registry/
      domain/
      application/
      infrastructure/
      contracts/
    ticketing/
    field-service/
    error-intelligence/
    knowledge/
    attachments/
    installations/
    sla-engine/
    jobs-orchestration/
    reporting/
  shared/
    domain/
      events/
      value-objects/
    infrastructure/
      db/
      storage/
      queue/
    contracts/
      api/
      events/
```
