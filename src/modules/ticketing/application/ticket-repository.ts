export interface TicketRecord {
  id: string;
  orgId: string;
  status: "open" | "triaged" | "assigned" | "in_progress" | "blocked" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  assigneeUserId: string | null;
  rowVersion: number;
  updatedAt: string;
}

export interface TicketEventRecord {
  id: string;
  orgId: string;
  ticketId: string;
  eventType: string;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface TicketRepository {
  findById(orgId: string, ticketId: string): Promise<TicketRecord | null>;
  updateAssignment(input: {
    orgId: string;
    ticketId: string;
    assigneeUserId: string;
    expectedRowVersion: number;
    nextRowVersion: number;
  }): Promise<TicketRecord | null>;
  updateStatus(input: {
    orgId: string;
    ticketId: string;
    fromStatus: TicketRecord["status"];
    toStatus: TicketRecord["status"];
    expectedRowVersion: number;
    nextRowVersion: number;
  }): Promise<TicketRecord | null>;
  appendEvent(event: TicketEventRecord): Promise<void>;
}