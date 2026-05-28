# Operational UI Validation Report (Vertical Slice v1)

Execution date: 2026-05-28
Scope: `/` workflow-first vertical slice UI (Ticket Intake → Assignment → Field Task → Attachment → Error Linking → Resolution → Audit Timeline)

## 1) Acceptance Summary

- **Status:** Conditional Pass (operationally usable, not yet production-ready)
- **Readiness score:** **81 / 100**
- **Gate blockers before next slice:**
  1. Architecture fitness gate has **1 repository leakage** and **1 event contract drift**.
  2. Runtime path still uses **in-memory validation harness** in server function wiring.

## 2) Real Use-Case Wiring vs Mock/Fake Paths

### What is real

- UI submits to real server function:
  - `validateTicketLifecycleVerticalSlice` (`src/modules/shared-orchestration/contracts/vertical-slice-validation.functions.ts`)
- Request/response contracts enforced by Zod on both ends:
  - `verticalSliceValidationRequestSchema`
  - `verticalSliceValidationResponseSchema`
- Transport mapping is explicit:
  - `mapWorkflowFormToRequest(...)`

### What is still temporary/mock

- Server function currently wires to `createInMemoryVerticalSliceValidationDeps()` (in-memory adapters), not DB-backed adapters.
- Temporary/in-memory components active in runtime path:
  - `InMemoryTransactionManager`
  - `InMemoryIdempotencyStore`
  - `InMemoryOutbox`
  - `InMemoryTicketRepo`
  - `InMemoryTaskRepo`
  - `InMemoryAttachmentRepo`
  - `InMemoryAuditRepo`
  - `InMemoryQueryValidator`
  - `InMemoryAuthorizationCache`
  - `InMemoryStorageProviderAdapter`

## 3) End-to-End Walkthrough (Documented)

### Input payload (observed)

- `orgId`, `actorUserId`, `actorRole`, `includeFailureScenarios`, `stressLevel`
- Workflow input:
  - Ticket intake (`title`, `description`, `priority`)
  - Assignment (`assigneeUserId`, `reason`)
  - Field task (`title`, `instructions`)
  - Attachment (`ownerType`, `fileName`, `mimeType`, `sizeBytes`, `checksumSha256`, `storageProvider`, `storageKey`)
  - Resolution (`summary`)
  - Error linking (`errorCodeId`, `confidence`, `source`)

### Calls and observed runtime

- Frontend call: `POST /_serverFn/...validateTicketLifecycleVerticalSlice...`
- Observed duration (browser request): **394ms** (single run), **843ms** (re-run)
- Response status: **200**

### Lifecycle stages: validations + events + updates

1. **Ticket Intake**
   - Validation: form + DTO schema
   - Update: ticket created, row version initialized
   - Event/Audit: `ticket.created`

2. **Assignment**
   - Validation: permission + idempotency begin + optimistic row version
   - Update: ticket status → assigned, row version increment
   - Event/Audit: `ticket.assigned`

3. **Field Task**
   - Validation: transition guard on task completion
   - Update: task scheduled then completed
   - Event/Audit: `field_task.scheduled`, `task.completed`

4. **Attachment**
   - Validation: owner existence/org ownership, MIME allow-list, checksum format, size limits
   - Update: attachment registered as uploaded
   - Event/Audit: `attachment.uploaded`

5. **Error Linking**
   - Validation: contract boundaries and link payload checks
   - Update: error link recorded in workflow validation output
   - Event/Audit: `error_code.linked`

6. **Resolution**
   - Validation: optimistic concurrency + transition correctness
   - Update: ticket status → resolved, row version increment
   - Event/Audit: `ticket.resolved`

### Audit timeline (observed)

- `ticket.created` (committed)
- `ticket.assigned` (committed)
- `field_task.scheduled` (committed)
- `attachment.uploaded` (committed)
- `task.completed` (committed)
- `ticket.resolved` (committed)
- `error_code.linked` (committed)

## 4) Workflow Efficiency Measurements

## Clicks required (happy path)

- Current default-filled flow:
  - **1 click** to execute (`Run workflow`)
  - +1 click if user switches tab (`Audit Timeline`/`Risks`)
- Real operator data-entry flow (estimated):
  - ~10–14 field interactions + 1 submit + 1 tab switch

### Keyboard flow

- Form controls are keyboard reachable (Tab traversal confirmed).
- Submit can be triggered via form submit semantics.
- Risk: no explicit “skip to results” shortcut for high-speed keyboard operators.

### Mobile flow

- At 390×844 (iPhone class):
  - Actions are stacked and usable.
  - Tabs remain accessible.
  - Result cards remain readable.
- Positive: no overlap/clipping observed in tested viewport.

### Task completion friction

- **Low friction** for validation harness usage due to prefilled defaults.
- **Medium friction** for real operations if full manual entry is needed repeatedly (many fields in single long form).

## 5) State Management Consistency Review

- **Loading states:** unified through `AsyncStateBanner` (single loading UX pattern).
- **Error states:** unified through same banner with standard message path.
- **Retry behavior:** unified via `retry()` replaying `lastPayload`.
- **Optimistic updates:** none in UI layer (no local optimistic mutation), so no optimistic-consistency break observed.

## 6) Accessibility Review

### Findings

- Keyboard navigation: **Pass** (core controls focusable and operable).
- Focus management: **Partial pass** (no major trap, but no explicit focus handoff to results after submit).
- Screen size behavior: **Pass** on tested desktop/mobile snapshots.
- Field technician usability: **Good baseline** (clear labels, large touch targets via `h-11 min-w-11`).

### A11y improvement recommendations

1. Move focus to Validation Outcome heading after successful run (or announce with stronger live region).
2. Add explicit `aria-label` for unlabeled secondary inputs where only `aria-label` is present today (maintain consistency with visible labels when possible).
3. Add a quick keyboard shortcut or jump link to results/timeline for operational speed.

## 7) Performance Review

- Initial load profile (observed):
  - TTFB: ~656ms
  - FCP: ~2256ms
  - Full load: ~3461ms
- Interaction responsiveness:
  - INP: **48ms** (good)
- Workflow call latency:
  - `/_serverFn` call observed at 394ms and 843ms in repeated execution
- Timeline rendering:
  - Smooth at current scale (small list)
- Mobile responsiveness:
  - Acceptable in tested iPhone-class viewport

## 8) TODOs / Placeholders / Temporary Adapters / Future Assumptions

### TODO markers

- No explicit `TODO`/`FIXME` markers found in the vertical-slice UI files.

### Placeholders and temporary assumptions found

1. `InMemoryQueryValidator` notes explicitly mark placeholders:
   - Replace with EXPLAIN-based index assertions
   - Wire real repository pagination tests
   - Wire telemetry-backed p95 checks
2. Runtime still depends on in-memory adapter composition in validation harness.
3. `temporary_downstream_failure` scenario exists for stress simulation (intentional test fixture).

### Mocked/temporary services inventory

- In-memory repos + tx + outbox + storage + auth cache (see Section 2 list).

### Future assumptions captured

- DB-backed telemetry and query plans will replace synthetic performance assertions.
- Production authorization cache invalidation needs full integration verification with real identity backend.

## 9) Architectural Leakage & Unnecessary Complexity

### Observed leakage

1. **Repository leakage violation (fitness gate):**
   - `src/modules/shared-orchestration/infrastructure/validation-harness.server.ts`
   - imports repository adapter validator from shared infrastructure in a way flagged by the current rule.

2. **Event contract drift (fitness gate):**
   - Emitted event `ticket.resolved` is not registered in `src/shared/contracts/events/domain-events.ts`.

### Complexity signals

- Single screen currently combines intake + execution + diagnostics + reporting in one long form.
- This is acceptable for validation phase but will become heavy for real operational speed if unchanged.

## 10) Refactor Recommendations (Before Next Slice)

### P0 (blockers)

1. Replace server function deps from in-memory harness to DB/RLS-backed adapters for acceptance-mode execution.
2. Fix event registry drift by adding `ticket.resolved` contract or aligning emitter naming.
3. Resolve repository leakage fitness finding (or tighten rule scoping to avoid false positives if intentional).

### P1 (strongly recommended)

1. Add post-submit focus strategy (focus result heading + announce summary in aria-live).
2. Add operator shortcut controls (jump to Audit Timeline, run/retry hotkeys).
3. Split form into staged sections with progressive reveal to reduce operational friction without adding visual complexity.

### P2 (next hardening step)

1. Add telemetry timings per stage (intake/assignment/task/attachment/resolution) for real UX speed baselines.
2. Add mobile-specific field technician test scenarios (glove-mode/touch interruptions/network jitter).

## 11) Final Acceptance Decision

- **Operational usability:** Good enough for architectural validation loop.
- **Production-grade readiness for expanding slices:** **Not yet** (due to fitness gate failures + in-memory runtime path).
- **Recommendation:** close P0 items first, then proceed to next slice.
