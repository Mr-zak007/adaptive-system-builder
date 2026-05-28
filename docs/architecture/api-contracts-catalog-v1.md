# API Contracts Catalog v1

## Shared Contracts

- `cursorPaginationRequestSchema`
- `cursorPaginationResponseSchema`
- `listTicketsFilterSchema`
- `apiErrorResponseSchema`
- `optimisticConcurrencyHeaderSchema`
- `idempotencyHeaderSchema`

Location: `src/shared/contracts/api/common.ts`

## Module Contracts

- Ticketing
  - `assignTicketRequestSchema`
  - `assignTicketResponseSchema`
  - `changeTicketStatusRequestSchema`

- Field Service
  - `completeTaskRequestSchema`
  - `completeTaskResponseSchema`
  - `transitionTaskRequestSchema`

- Attachments
  - `registerAttachmentRequestSchema`
  - `registerAttachmentResponseSchema`

- Error Intelligence
  - `linkErrorCodeRequestSchema`
  - `linkErrorCodeResponseSchema`

- Knowledge
  - `publishSolutionRequestSchema`
  - `publishSolutionResponseSchema`

- Installations
  - `updateInstallationWorkflowRequestSchema`
  - `updateInstallationWorkflowResponseSchema`

## Domain Event Contracts

- `ticket.created`
- `ticket.assigned`
- `task.completed`
- `solution.published`
- `attachment.uploaded`
- `escalation.triggered`

Location: `src/shared/contracts/events/domain-events.ts`