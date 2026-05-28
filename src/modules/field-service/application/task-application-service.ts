import { completeTaskRequestSchema } from "@/modules/field-service/contracts/task.contracts";
import { assertTaskTransitionAllowed } from "@/modules/field-service/domain/task-invariants";
import type { TaskRepository } from "@/modules/field-service/application/task-repository";

export interface TaskDomainEventPublisher {
  publishTaskCompleted(input: {
    orgId: string;
    taskId: string;
    ticketId: string;
    completedByUserId: string;
    outcome: "success" | "failed";
    completionNotes?: string;
  }): Promise<void>;
}

export class TaskApplicationService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly eventPublisher: TaskDomainEventPublisher,
  ) {}

  async completeTask(input: {
    orgId: string;
    taskId: string;
    actorUserId: string;
    headers: { idempotencyKey: string; ifMatchVersion: number };
    body: { outcome: "success" | "failed"; completionNotes?: string };
  }) {
    const parsed = completeTaskRequestSchema.parse({
      headers: input.headers,
      body: input.body,
    });

    const current = await this.taskRepository.findById(input.orgId, input.taskId);
    if (!current) {
      throw new Error("NOT_FOUND: task not found");
    }

    assertTaskTransitionAllowed(current.status, "done");

    const updated = await this.taskRepository.transitionStatus({
      orgId: input.orgId,
      taskId: input.taskId,
      fromStatus: current.status,
      toStatus: "done",
      expectedRowVersion: parsed.headers.ifMatchVersion,
      nextRowVersion: parsed.headers.ifMatchVersion + 1,
      completionNotes: parsed.body.completionNotes,
    });

    if (!updated) {
      throw new Error("VERSION_CONFLICT: failed to update task");
    }

    await this.eventPublisher.publishTaskCompleted({
      orgId: input.orgId,
      taskId: updated.id,
      ticketId: updated.ticketId,
      completedByUserId: input.actorUserId,
      outcome: parsed.body.outcome,
      completionNotes: parsed.body.completionNotes,
    });

    return {
      taskId: updated.id,
      status: updated.status,
      rowVersion: updated.rowVersion,
    };
  }
}