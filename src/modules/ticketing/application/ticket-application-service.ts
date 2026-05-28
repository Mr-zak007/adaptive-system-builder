import { assignTicketRequestSchema } from "@/modules/ticketing/contracts/ticket.contracts";
import { assertTicketTransitionAllowed } from "@/modules/ticketing/domain/ticket-invariants";
import type { TicketRepository } from "@/modules/ticketing/application/ticket-repository";

export interface TicketDomainEventPublisher {
  publishTicketAssigned(input: {
    orgId: string;
    ticketId: string;
    assigneeUserId: string;
    previousAssigneeUserId: string | null;
    assignedByUserId: string;
    rowVersion: number;
  }): Promise<void>;
}

export interface TicketApplicationService {
  assignTicket(input: {
    orgId: string;
    ticketId: string;
    actorUserId: string;
    headers: { idempotencyKey: string; ifMatchVersion: number };
    body: { assigneeUserId: string; reason: string };
  }): Promise<{
    ticketId: string;
    status: string;
    assigneeUserId: string;
    rowVersion: number;
  }>;
}

export class DefaultTicketApplicationService implements TicketApplicationService {
  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly eventPublisher: TicketDomainEventPublisher,
  ) {}

  async assignTicket(input: {
    orgId: string;
    ticketId: string;
    actorUserId: string;
    headers: { idempotencyKey: string; ifMatchVersion: number };
    body: { assigneeUserId: string; reason: string };
  }) {
    const parsed = assignTicketRequestSchema.parse({
      headers: input.headers,
      body: input.body,
    });

    const current = await this.ticketRepository.findById(input.orgId, input.ticketId);
    if (!current) {
      throw new Error("NOT_FOUND: ticket not found");
    }

    assertTicketTransitionAllowed(current.status, "assigned");

    const updated = await this.ticketRepository.updateAssignment({
      orgId: input.orgId,
      ticketId: input.ticketId,
      assigneeUserId: parsed.body.assigneeUserId,
      expectedRowVersion: parsed.headers.ifMatchVersion,
      nextRowVersion: parsed.headers.ifMatchVersion + 1,
    });

    if (!updated) {
      throw new Error("VERSION_CONFLICT: failed to update ticket assignment");
    }

    await this.eventPublisher.publishTicketAssigned({
      orgId: input.orgId,
      ticketId: updated.id,
      assigneeUserId: updated.assigneeUserId ?? parsed.body.assigneeUserId,
      previousAssigneeUserId: current.assigneeUserId,
      assignedByUserId: input.actorUserId,
      rowVersion: updated.rowVersion,
    });

    return {
      ticketId: updated.id,
      status: updated.status,
      assigneeUserId: updated.assigneeUserId ?? parsed.body.assigneeUserId,
      rowVersion: updated.rowVersion,
    };
  }
}