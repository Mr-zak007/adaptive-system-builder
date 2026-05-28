import { z } from "zod";

export const assignTicketUseCaseRequestSchema = z.object({
  ticketId: z.string().uuid(),
  assigneeUserId: z.string().uuid(),
  reason: z.string().trim().min(1).max(500),
  ifMatchVersion: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
});

export const resolveTicketUseCaseRequestSchema = z.object({
  ticketId: z.string().uuid(),
  resolutionSummary: z.string().trim().min(1).max(2000),
  ifMatchVersion: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
});

export const scheduleFieldTaskUseCaseRequestSchema = z.object({
  ticketId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  instructions: z.string().trim().max(2000).optional(),
  assigneeUserId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  idempotencyKey: z.string().uuid(),
});

export const publishSolutionUseCaseRequestSchema = z.object({
  solutionId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  problemStatement: z.string().trim().min(1).max(2000),
  solutionSteps: z.array(z.string().trim().min(1).max(1000)).min(1).max(50),
  ifMatchVersion: z.number().int().positive(),
  idempotencyKey: z.string().uuid(),
});

export const attachErrorCodeUseCaseRequestSchema = z.object({
  ticketId: z.string().uuid(),
  errorCodeId: z.string().uuid(),
  confidence: z.number().min(0).max(100).optional(),
  source: z.string().trim().max(100).optional(),
  idempotencyKey: z.string().uuid(),
});