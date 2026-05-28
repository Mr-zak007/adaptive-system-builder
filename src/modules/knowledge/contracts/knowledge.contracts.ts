import { z } from "zod";
import { optimisticConcurrencyHeaderSchema } from "@/shared/contracts/api/common";

export const publishSolutionRequestSchema = z.object({
  headers: optimisticConcurrencyHeaderSchema,
  body: z.object({
    solutionId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    problemStatement: z.string().trim().min(1).max(2000),
    solutionSteps: z.array(z.string().trim().min(1).max(1000)).min(1).max(50),
    effectivenessScore: z.number().min(0).max(100).optional(),
  }),
});

export const publishSolutionResponseSchema = z.object({
  solutionId: z.string().uuid(),
  publishedAt: z.string().datetime(),
  rowVersion: z.number().int().positive(),
});

export type PublishSolutionRequestDto = z.infer<typeof publishSolutionRequestSchema>;
export type PublishSolutionResponseDto = z.infer<typeof publishSolutionResponseSchema>;