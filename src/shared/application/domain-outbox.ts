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

  peekPending(input: {
    orgId: string;
    limit: number;
  }): Promise<
    Array<{
      messageId: string;
      aggregateType: string;
      aggregateId: string;
      eventName: string;
      dedupeKey: string;
      sequence: number;
      attemptCount: number;
      status: "pending" | "failed";
    }>
  >;

  markDelivered(input: { messageId: string }): Promise<void>;

  markFailed(input: {
    messageId: string;
    reason: string;
  }): Promise<void>;

  retryFailed(input: {
    orgId: string;
    maxAttempts: number;
  }): Promise<number>;
}