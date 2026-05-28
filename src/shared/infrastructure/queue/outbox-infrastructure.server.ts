import type { DomainOutbox } from "@/shared/application/domain-outbox";

export interface RetryBackoffPolicy {
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
  deadLetterAfterAttempts: number;
}

export interface OutboxDeliveryOutcome {
  delivered: number;
  failed: number;
  deadLettered: number;
}

export interface ReplaySafeOutboxInfrastructure {
  validateReplaySafety(input: { orgId: string; dedupeKey: string }): Promise<{ replayBlocked: boolean; notes: string[] }>;
  processBatch(input: {
    orgId: string;
    limit: number;
    policy: RetryBackoffPolicy;
    deliver: (message: {
      messageId: string;
      aggregateType: string;
      aggregateId: string;
      eventName: string;
      dedupeKey: string;
      sequence: number;
      attemptCount: number;
    }) => Promise<"ok" | "retryable_error" | "poison">;
  }): Promise<OutboxDeliveryOutcome>;
}

function computeBackoffMs(attempt: number, policy: RetryBackoffPolicy) {
  const exponential = Math.min(policy.maxDelayMs, policy.baseDelayMs * Math.pow(2, Math.max(0, attempt - 1)));
  const jitter = Math.floor(exponential * policy.jitterRatio * Math.random());
  return Math.min(policy.maxDelayMs, exponential + jitter);
}

export class DefaultReplaySafeOutboxInfrastructure implements ReplaySafeOutboxInfrastructure {
  constructor(private readonly outbox: DomainOutbox) {}

  async validateReplaySafety(input: { orgId: string; dedupeKey: string }) {
    const pending = await this.outbox.peekPending({ orgId: input.orgId, limit: 100 });
    const duplicateCount = pending.filter((message) => message.dedupeKey === input.dedupeKey).length;

    return {
      replayBlocked: duplicateCount <= 1,
      notes: [
        duplicateCount <= 1
          ? "Outbox dedupe key uniqueness is holding for pending/failed messages."
          : "Duplicate dedupe keys detected in outbox pending set.",
      ],
    };
  }

  async processBatch(input: {
    orgId: string;
    limit: number;
    policy: RetryBackoffPolicy;
    deliver: (message: {
      messageId: string;
      aggregateType: string;
      aggregateId: string;
      eventName: string;
      dedupeKey: string;
      sequence: number;
      attemptCount: number;
    }) => Promise<"ok" | "retryable_error" | "poison">;
  }): Promise<OutboxDeliveryOutcome> {
    const batch = await this.outbox.peekPending({ orgId: input.orgId, limit: input.limit });

    let delivered = 0;
    let failed = 0;
    let deadLettered = 0;

    for (const message of batch) {
      const outcome = await input.deliver(message);

      if (outcome === "ok") {
        await this.outbox.markDelivered({ messageId: message.messageId });
        delivered += 1;
        continue;
      }

      if (outcome === "poison") {
        await this.outbox.markFailed({
          messageId: message.messageId,
          reason: "poison_message: moved_to_dead_letter",
        });
        deadLettered += 1;
        continue;
      }

      const projectedAttempt = message.attemptCount + 1;
      const exceededDeadLetterThreshold = projectedAttempt >= input.policy.deadLetterAfterAttempts;

      await this.outbox.markFailed({
        messageId: message.messageId,
        reason: exceededDeadLetterThreshold
          ? "retry_exhausted: moved_to_dead_letter"
          : `retryable_error: backoff_ms=${computeBackoffMs(projectedAttempt, input.policy)}`,
      });

      if (exceededDeadLetterThreshold) {
        deadLettered += 1;
      } else {
        failed += 1;
      }
    }

    if (failed > 0) {
      await this.outbox.retryFailed({
        orgId: input.orgId,
        maxAttempts: input.policy.deadLetterAfterAttempts,
      });
    }

    return {
      delivered,
      failed,
      deadLettered,
    };
  }
}
