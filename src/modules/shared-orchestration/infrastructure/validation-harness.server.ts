import type { DomainOutbox } from "@/shared/application/domain-outbox";
import type { IdempotencyStore, IdempotencyStartResult } from "@/shared/application/idempotency-store";
import type { TransactionContext, TransactionManager } from "@/shared/application/transaction-manager";
import type {
  SliceAttachmentRepositoryPort,
  SliceAuditRepositoryPort,
  SliceFieldTaskRepositoryPort,
  SliceQueryValidationPort,
  SliceTicketRepositoryPort,
  VerticalSliceValidationDeps,
} from "@/modules/shared-orchestration/application/vertical-slice-validation.service";
import { randomUUID } from "node:crypto";

type TicketStatus = "open" | "assigned" | "resolved";
type TaskStatus = "pending" | "done";

interface TicketRow {
  id: string;
  orgId: string;
  status: TicketStatus;
  rowVersion: number;
}

interface TaskRow {
  id: string;
  orgId: string;
  ticketId: string;
  status: TaskStatus;
  rowVersion: number;
}

interface AttachmentRow {
  id: string;
  orgId: string;
  ownerType: "ticket" | "field_task";
  ownerId: string;
  status: string;
}

function cloneMap<K, V>(source: Map<K, V>, cloneValue?: (value: V) => V) {
  const next = new Map<K, V>();
  for (const [key, value] of source.entries()) {
    next.set(key, cloneValue ? cloneValue(value) : value);
  }
  return next;
}

class InMemoryValidationStore {
  tickets = new Map<string, TicketRow>();
  tasks = new Map<string, TaskRow>();
  attachments = new Map<string, AttachmentRow>();
  ticketEvents: Array<Record<string, unknown>> = [];
  auditLogs: Array<Record<string, unknown>> = [];
  outboxKeys = new Set<string>();
  idempotency = new Map<string, { requestHash: string; response?: unknown }>();
}

class InMemoryTransactionManager implements TransactionManager {
  constructor(private readonly store: InMemoryValidationStore) {}

  async runInTransaction<T>(
    _operationName: string,
    run: (tx: TransactionContext) => Promise<T>,
  ): Promise<T> {
    const ticketSnapshot = cloneMap(this.store.tickets, (v) => ({ ...v }));
    const taskSnapshot = cloneMap(this.store.tasks, (v) => ({ ...v }));
    const attachmentSnapshot = cloneMap(this.store.attachments, (v) => ({ ...v }));
    const eventSnapshot = this.store.ticketEvents.slice();
    const auditSnapshot = this.store.auditLogs.slice();
    const outboxSnapshot = new Set(this.store.outboxKeys);

    try {
      return await run({ requestId: randomUUID() });
    } catch (error) {
      this.store.tickets = ticketSnapshot;
      this.store.tasks = taskSnapshot;
      this.store.attachments = attachmentSnapshot;
      this.store.ticketEvents = eventSnapshot;
      this.store.auditLogs = auditSnapshot;
      this.store.outboxKeys = outboxSnapshot;
      throw error;
    }
  }
}

class InMemoryIdempotencyStore implements IdempotencyStore {
  constructor(private readonly store: InMemoryValidationStore) {}

  async begin(input: {
    orgId: string;
    operationType: string;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<IdempotencyStartResult> {
    const key = `${input.orgId}:${input.operationType}:${input.idempotencyKey}`;
    const existing = this.store.idempotency.get(key);

    if (!existing) {
      this.store.idempotency.set(key, { requestHash: input.requestHash });
      return { kind: "started" };
    }

    if (existing.requestHash !== input.requestHash) {
      return { kind: "conflict" };
    }

    return { kind: "replay", response: existing.response ?? null };
  }

  async complete(input: {
    orgId: string;
    operationType: string;
    idempotencyKey: string;
    response: unknown;
  }): Promise<void> {
    const key = `${input.orgId}:${input.operationType}:${input.idempotencyKey}`;
    const existing = this.store.idempotency.get(key);
    if (existing) {
      this.store.idempotency.set(key, {
        ...existing,
        response: input.response,
      });
    }
  }
}

class InMemoryOutbox implements DomainOutbox {
  constructor(private readonly store: InMemoryValidationStore) {}

  async appendOnce(input: {
    orgId: string;
    aggregateType: string;
    aggregateId: string;
    eventName: string;
    dedupeKey: string;
    payload: Record<string, unknown>;
    occurredAt: string;
  }): Promise<boolean> {
    const key = `${input.orgId}:${input.aggregateType}:${input.aggregateId}:${input.eventName}:${input.dedupeKey}`;
    if (this.store.outboxKeys.has(key)) {
      return false;
    }

    this.store.outboxKeys.add(key);
    return true;
  }
}

class InMemoryTicketRepo implements SliceTicketRepositoryPort {
  constructor(private readonly store: InMemoryValidationStore) {}

  async createTicket(input: {
    orgId: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "critical";
    createdByUserId: string;
  }) {
    const ticketId = randomUUID();
    const row = {
      id: ticketId,
      orgId: input.orgId,
      status: "open" as const,
      rowVersion: 1,
    };
    this.store.tickets.set(ticketId, row);
    return { ticketId, rowVersion: row.rowVersion, status: row.status };
  }

  async assignTicket(input: {
    orgId: string;
    ticketId: string;
    assigneeUserId: string;
    expectedRowVersion: number;
  }) {
    const row = this.store.tickets.get(input.ticketId);
    if (!row || row.orgId !== input.orgId || row.rowVersion !== input.expectedRowVersion || row.status === "resolved") {
      return null;
    }

    row.status = "assigned";
    row.rowVersion += 1;
    this.store.tickets.set(input.ticketId, row);
    return { rowVersion: row.rowVersion, status: row.status };
  }

  async resolveTicket(input: {
    orgId: string;
    ticketId: string;
    expectedRowVersion: number;
    resolutionSummary: string;
  }) {
    const row = this.store.tickets.get(input.ticketId);
    if (!row || row.orgId !== input.orgId || row.rowVersion !== input.expectedRowVersion) {
      return null;
    }

    row.status = "resolved";
    row.rowVersion += 1;
    this.store.tickets.set(input.ticketId, row);
    return { rowVersion: row.rowVersion, status: row.status };
  }

  async appendTicketEvent(input: {
    orgId: string;
    ticketId: string;
    eventType: string;
    actorUserId: string;
    payload: Record<string, unknown>;
  }) {
    this.store.ticketEvents.push({ ...input, id: randomUUID(), createdAt: new Date().toISOString() });
  }
}

class InMemoryTaskRepo implements SliceFieldTaskRepositoryPort {
  constructor(private readonly store: InMemoryValidationStore) {}

  async createTask(input: {
    orgId: string;
    ticketId: string;
    assigneeUserId: string;
    title: string;
    instructions: string;
  }) {
    const taskId = randomUUID();
    const row = {
      id: taskId,
      orgId: input.orgId,
      ticketId: input.ticketId,
      status: "pending" as const,
      rowVersion: 1,
    };
    this.store.tasks.set(taskId, row);
    return { taskId, rowVersion: row.rowVersion, status: row.status };
  }

  async completeTask(input: {
    orgId: string;
    taskId: string;
    expectedRowVersion: number;
    completionNotes: string;
  }) {
    const row = this.store.tasks.get(input.taskId);
    if (!row || row.orgId !== input.orgId || row.rowVersion !== input.expectedRowVersion || row.status === "done") {
      return null;
    }

    row.status = "done";
    row.rowVersion += 1;
    this.store.tasks.set(input.taskId, row);
    return { rowVersion: row.rowVersion, status: row.status };
  }
}

class InMemoryAttachmentRepo implements SliceAttachmentRepositoryPort {
  constructor(private readonly store: InMemoryValidationStore) {}

  async registerAttachment(input: {
    orgId: string;
    ownerType: "ticket" | "field_task";
    ownerId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    storageProvider: string;
    storageKey: string;
  }) {
    const ownerExists =
      input.ownerType === "ticket"
        ? this.store.tickets.has(input.ownerId)
        : this.store.tasks.has(input.ownerId);

    if (!ownerExists) {
      throw new Error("ATTACHMENT_OWNER_INVALID: owner does not exist");
    }

    const attachmentId = randomUUID();
    this.store.attachments.set(attachmentId, {
      id: attachmentId,
      orgId: input.orgId,
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      status: "uploaded",
    });

    return { attachmentId, status: "uploaded" };
  }
}

class InMemoryAuditRepo implements SliceAuditRepositoryPort {
  constructor(private readonly store: InMemoryValidationStore) {}

  async appendAudit(input: {
    orgId: string;
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string;
    requestId: string;
    correlationId: string;
    beforeData?: Record<string, unknown>;
    afterData?: Record<string, unknown>;
  }) {
    this.store.auditLogs.push({ ...input, id: randomUUID(), createdAt: new Date().toISOString() });
  }
}

class InMemoryQueryValidator implements SliceQueryValidationPort {
  async validateIndexUsage(_input: { orgId: string }) {
    return {
      usedExpectedIndexes: true,
      notes: ["Validation harness placeholder: replace with EXPLAIN ANALYZE assertions in DB adapter."],
    };
  }

  async validatePaginationFiltering(_input: { orgId: string }) {
    return {
      paginationStable: true,
      filteringCorrect: true,
      notes: ["Validation harness placeholder: wire to real repository pagination tests."],
    };
  }

  async validateAttachmentLookupPerformance(_input: { orgId: string }) {
    return {
      withinThreshold: true,
      p95Ms: 8,
      notes: ["Validation harness placeholder: wire to real telemetry-backed p95 checks."],
    };
  }
}

export function createInMemoryVerticalSliceValidationDeps(): VerticalSliceValidationDeps {
  const store = new InMemoryValidationStore();

  return {
    txManager: new InMemoryTransactionManager(store),
    idempotencyStore: new InMemoryIdempotencyStore(store),
    outbox: new InMemoryOutbox(store),
    ticketRepo: new InMemoryTicketRepo(store),
    taskRepo: new InMemoryTaskRepo(store),
    attachmentRepo: new InMemoryAttachmentRepo(store),
    auditRepo: new InMemoryAuditRepo(store),
    queryValidator: new InMemoryQueryValidator(),
  };
}