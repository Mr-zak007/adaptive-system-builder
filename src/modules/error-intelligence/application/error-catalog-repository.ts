export interface ErrorCatalogRepository {
  createErrorCode(input: {
    orgId: string;
    code: string;
    title: string;
    details: string;
    severity: "low" | "medium" | "high" | "critical";
    relatedSolutionIds: string[];
    linkedTicketIds: string[];
  }): Promise<{ id: string; relatedSolutionIds: string[] }>;
  linkTicket(input: { orgId: string; errorCodeId: string; ticketId: string }): Promise<void>;
  getStatistics(orgId: string): Promise<{
    totalErrorCodes: number;
    linkedTickets: number;
    linkedSolutions: number;
  }>;
}