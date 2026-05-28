export interface IncidentOrchestrationService {
  onTaskCompleted(input: {
    orgId: string;
    taskId: string;
    ticketId: string;
    completedByUserId: string;
    outcome: "success" | "failed";
  }): Promise<void>;

  onTicketAssigned(input: {
    orgId: string;
    ticketId: string;
    assigneeUserId: string;
    assignedByUserId: string;
  }): Promise<void>;
}

// Boundary-only contract: implementation must coordinate through
// application services + domain events, never direct cross-module table writes.