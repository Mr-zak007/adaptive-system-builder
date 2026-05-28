export interface TaskRecord {
  id: string;
  orgId: string;
  ticketId: string;
  assigneeUserId: string | null;
  status: "pending" | "scheduled" | "in_progress" | "done" | "failed" | "canceled";
  rowVersion: number;
  updatedAt: string;
}

export interface TaskRepository {
  findById(orgId: string, taskId: string): Promise<TaskRecord | null>;
  transitionStatus(input: {
    orgId: string;
    taskId: string;
    fromStatus: TaskRecord["status"];
    toStatus: TaskRecord["status"];
    expectedRowVersion: number;
    nextRowVersion: number;
    completionNotes?: string;
  }): Promise<TaskRecord | null>;
}