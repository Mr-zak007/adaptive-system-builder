# Infrastructure Hardening Readiness v1

## Production Readiness Review

- **DB/RLS Hardening:** tenant-isolation policy migration added with explicit coverage validator (`validate_rls_policy_coverage`).
- **Authorization Cache Safety:** stale-cache fail-safe deny + revision-based invalidation strategy implemented in adapter.
- **Outbox/Async Safety:** replay-safe processing, bounded retry backoff, poison/dead-letter path, and dedupe validation wired.
- **Storage Hardening:** provider abstraction, signed upload strategy, secure key scoping, orphan reconciliation, retention hooks.
- **Observability Foundation:** trace context propagation primitives + metrics registry for baseline capture.
- **Fitness Gates:** automated checks now include forbidden imports + event contract drift, plus runnable CI gate script.

## Risk Register (Current)

1. **Real DB runtime coverage gap** for lock-contention semantics remains until DB-backed integration mode is executed in CI.
2. **Outbox throughput risk** under sustained retry storms needs production queue pressure tests.
3. **Audit/event amplification risk** for attachment-heavy workloads requires partition + retention execution plan.

## Technical Debt Register

1. Replace migration-text RLS assertions with runtime SQL assertions against deployed database.
2. Wire repository validator to concrete adapter source scans instead of static token input.
3. Add tenant-aware storage cleanup scheduler contract and dead-letter replay command contract.

## Scaling Roadmap

### Near-term
- CI run: architectural fitness gate + policy coverage check + vertical-slice stress validation.
- Add periodic query-plan regression checks for timeline/attachments/event-outbox queries.

### Mid-term
- Partition `ticket_events`, `domain_events`, and `audit_logs` by time/org.
- Add adaptive outbox concurrency controls based on retry pressure.

### Long-term
- Workload-isolated async workers for heavy attachments/events.
- SLO-backed operational dashboards on trace+metrics foundation.

## Performance Baseline (Initial Contract)

Baseline metric keys captured for regression comparison:

- `assignment_workflow_ms`
- `ticket_timeline_query_ms`
- `attachment_heavy_query_ms`
- `event_write_ms`
- `audit_write_ms`

These are exposed via the metrics registry and intended for CI/telemetry-backed p95 snapshots.
