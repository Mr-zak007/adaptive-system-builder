# Contracts, Event Flows, and State Transitions v1

## 1) ERD Coverage (v1)

Core entities included in migration v1:
- Organizations, User Roles
- Product Catalog Models
- Clients, Solar Systems, Installed Components
- Tickets, Ticket Events, Field Tasks
- Error Codes, Ticket Error Codes, Error Code Intelligence
- Knowledge Articles, Proven Solutions, Troubleshooting Procedures, Solution/Error map
- Attachments (polymorphic owner)
- Installation Projects, Installation Tasks
- SLA Policies, Ticket SLA Timers
- Domain Events, Job Executions, Operation Idempotency, Audit Logs

## 2) API Contract Examples (Application layer)

### A) Assign ticket (idempotent + optimistic lock)
- **Command**: `POST /api/tickets/{ticketId}/assign`
- **Headers**:
  - `Idempotency-Key: <uuid>`
  - `If-Match-Version: <row_version>`
- **Body**:
```json
{ "assigneeUserId": "uuid", "reason": "dispatch policy" }
```
- **Success 200**:
```json
{ "ticketId": "uuid", "status": "assigned", "rowVersion": 8 }
```
- **Conflict 409** (optimistic lock):
```json
{ "error": "VERSION_CONFLICT", "currentRowVersion": 9 }
```
- **Replay 200** (idempotency hit): same previous response payload.

### B) Complete field task (idempotent)
- **Command**: `POST /api/field-tasks/{taskId}/complete`
- **Headers**:
  - `Idempotency-Key: <uuid>`
  - `If-Match-Version: <row_version>`
- **Body**:
```json
{ "completionNotes": "replaced inverter fan", "outcome": "success" }
```

### C) Register attachment (abstraction first)
- **Command**: `POST /api/attachments/register`
- **Body**:
```json
{
  "ownerType": "ticket",
  "ownerId": "uuid",
  "fileName": "panel.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 348239,
  "checksumSha256": "...",
  "storageProvider": "lovable_storage",
  "storageKey": "tickets/uuid/panel.jpg"
}
```
- **Validation**:
  - MIME allowlist per owner type
  - max size by MIME class
  - checksum required

### D) Search knowledge (separated domains)
- **Query**: `GET /api/knowledge/search?q=inverter+E12&scope=articles,solutions,procedures,error_intel&cursor=...`
- Returns federated result buckets with cursor-based pagination.

## 3) Internal Domain Event Flow Examples

### Ticket assignment
1. `AssignTicketCommand` received.
2. Validate role and concurrency (`row_version`).
3. Update ticket + insert ticket_event + append audit_log.
4. Append domain event `ticket.assigned`.
5. Enqueue async jobs:
   - notification dispatch
   - SLA timer recalculation
   - search/read-model refresh

### Task completion
1. `CompleteTaskCommand` received.
2. Idempotency check (operation table).
3. Transition task state to `done`.
4. Emit `field_task.completed`.
5. Policy engine may emit `ticket.ready_for_resolution`.

### Media processing
1. Attachment registered as `uploaded`.
2. `attachment.processing.requested` emitted.
3. Worker picks job with lock + retry policy.
4. On success: status `ready`, emit `attachment.ready`.
5. On failure: retry with backoff; terminal -> `failed` + dead-letter job.

### SLA escalation jobs
1. Scheduler queries `ticket_sla_timers` due soon/overdue.
2. For each timer, lock row + verify latest ticket state.
3. Emit `sla.breached` when threshold crossed.
4. Create audit row + escalation notification job.

## 4) State Transition Contracts

### Ticket lifecycle (guarded)
- open -> triaged -> assigned -> in_progress -> resolved -> closed
- allowed backward path: resolved -> in_progress (reopen), closed -> in_progress (reopen with reason)
- blocked is side state from assigned/in_progress and can return to in_progress.

### Field task lifecycle
- pending -> scheduled -> in_progress -> done
- failure path: in_progress -> failed
- cancel path: pending/scheduled -> canceled

### Attachment lifecycle
- uploaded -> processing -> ready
- uploaded/processing -> failed
- ready/failed -> deleted (soft delete + storage delete async)

### SLA timer lifecycle
- pending -> running -> met
- pending/running -> breached
- pending/running -> canceled

## 5) Pagination/Filtering Baseline

- Cursor pagination default with `(created_at, id)` or `(updated_at, id)` stable sort.
- Filter allowlist (no arbitrary column injection).
- Large lists must have server-side hard limits (max page size).
- Separate read model endpoints for reporting to avoid OLTP query pressure.
