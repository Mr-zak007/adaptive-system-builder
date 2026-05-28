export interface DomainOutbox {
  appendOnce(input: {
    orgId: string;
    aggregateType: string;
    aggregateId: string;
    eventName: string;
    dedupeKey: string;
    payload: Record<string, unknown>;
    occurredAt: string;
  }): Promise<boolean>;
}