import { z } from "zod";

export const retryPolicySchema = z.object({
  maxAttempts: z.number().int().min(1).max(50),
  initialBackoffMs: z.number().int().min(100).max(60000),
  maxBackoffMs: z.number().int().min(1000).max(3600000),
  jitterRatio: z.number().min(0).max(1).default(0.2),
});

export const deadLetterPolicySchema = z.object({
  enabled: z.boolean(),
  deadLetterQueue: z.string().min(1).max(100),
  retentionDays: z.number().int().min(1).max(90),
});

export const jobExecutionContractSchema = z.object({
  jobType: z.string().min(1).max(120),
  timeoutMs: z.number().int().min(1000).max(900000),
  concurrencyLimit: z.number().int().min(1).max(100),
  idempotencyKey: z.string().min(1).max(255),
  retryPolicy: retryPolicySchema,
  deadLetterPolicy: deadLetterPolicySchema,
  replaySafe: z.literal(true),
});

export type JobExecutionContract = z.infer<typeof jobExecutionContractSchema>;