export interface ErrorCodeLinkRecord {
  id: string;
  orgId: string;
  ticketId: string;
  errorCodeId: string;
  confidence: number | null;
  source: string | null;
  detectedAt: string;
}

export interface ErrorIntelligenceRepository {
  linkErrorCodeToTicket(input: {
    orgId: string;
    ticketId: string;
    errorCodeId: string;
    confidence?: number;
    source?: string;
  }): Promise<ErrorCodeLinkRecord>;
}