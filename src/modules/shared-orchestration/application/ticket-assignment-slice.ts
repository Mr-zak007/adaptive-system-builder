import type { TransactionManager } from "@/shared/application/transaction-manager";
import type { IdempotencyStore } from "@/shared/application/idempotency-store";
import type { DomainOutbox } from "@/shared/application/domain-outbox";

export interface AssignTicketUseCasePort {
  execute(input: {
    orgId: string;
    actorUserId: string;
    ticketId: string;
    assigneeUserId: string;
    reason: string;
    ifMatchVersion: number;
    idempotencyKey: string;
  }): Promise<{ ticketId: string; rowVersion: number }>;
}

export interface ScheduleFieldTaskUseCasePort {
  execute(input: {
    orgId: string;
    actorUserId: string;
    ticketId: string;
    assigneeUserId: string;
    title: string;
    instructions?: string;
    idempotencyKey: string;
  }): Promise<{ taskId: string }>;
}

export interface RegisterAttachmentUseCasePort {
  execute(input: {
    orgId: string;
    actorUserId: string;
    ownerType: "ticket" | "field_task";
    ownerId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    storageProvider: string;
    storageKey: string;
  }): Promise<{ attachmentId: string }>;
}

export interface ResolveTicketUseCasePort {
  execute(input: {
    orgId: string;
    actorUserId: string;
    ticketId: string;
    resolutionSummary: string;
    ifMatchVersion: number;
    idempotencyKey: string;
  }): Promise<{ ticketId: string; rowVersion: number }>;
}

export interface TicketAssignmentVerticalSliceDeps {
  txManager: TransactionManager;
  idempotencyStore: IdempotencyStore;
  outbox: DomainOutbox;
  assignTicket: AssignTicketUseCasePort;
  scheduleFieldTask: ScheduleFieldTaskUseCasePort;
  registerAttachment: RegisterAttachmentUseCasePort;
  resolveTicket: ResolveTicketUseCasePort;
}

// Vertical-slice coordinator contract only.
// Implementation must orchestrate use-case ports without bypassing module boundaries.