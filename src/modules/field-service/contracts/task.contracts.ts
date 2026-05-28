import { z } from "zod";
import {
  idempotencyHeaderSchema,
  optimisticConcurrencyHeaderSchema,
} from "@/shared/contracts/api/common";

export const taskStatusSchema = z.enum([
  "pending",
  "scheduled",
  "in_progress",
  "done",
  "failed",
  "canceled",
]);

export const completeTaskRequestSchema = z.object({
  headers: idempotencyHeaderSchema.merge(optimisticConcurrencyHeaderSchema),
  body: z.object({
    outcome: z.enum(["success", "failed"]),
    completionNotes: z.string().trim().max(2000).optional(),
  }),
});

export const completeTaskResponseSchema = z.object({
  taskId: z.string().uuid(),
  status: z.literal("done"),
  completedAt: z.string().datetime(),
  rowVersion: z.number().int().positive(),
});

export const transitionTaskRequestSchema = z.object({
  headers: optimisticConcurrencyHeaderSchema,
  body: z.object({
    toStatus: taskStatusSchema,
    reason: z.string().trim().min(1).max(500),
  }),
});

export type CompleteTaskRequestDto = z.infer<typeof completeTaskRequestSchema>;
export type CompleteTaskResponseDto = z.infer<typeof completeTaskResponseSchema>;
export type TransitionTaskRequestDto = z.infer<typeof transitionTaskRequestSchema>;