import { z } from "zod";

export const errorCodeCatalogInputSchema = z.object({
  code: z.string().trim().min(3).max(30),
  title: z.string().trim().min(3).max(200),
  details: z.string().trim().min(5).max(2000),
  severity: z.enum(["low", "medium", "high", "critical"]),
  relatedSolutionIds: z.array(z.string().uuid()).max(20),
  linkedTicketIds: z.array(z.string().uuid()).max(50),
});

export const errorCodeStatisticsSchema = z.object({
  totalErrorCodes: z.number().int().nonnegative(),
  linkedTickets: z.number().int().nonnegative(),
  linkedSolutions: z.number().int().nonnegative(),
});

export const errorIntelligenceSliceRequestSchema = z.object({
  orgId: z.string().uuid(),
  errorCode: errorCodeCatalogInputSchema,
  linkTicketId: z.string().uuid(),
});

export const errorIntelligenceSliceResponseSchema = z.object({
  errorCodeId: z.string().uuid(),
  linkedTicketId: z.string().uuid(),
  relatedSolutions: z.array(z.string().uuid()),
  statistics: errorCodeStatisticsSchema,
});

export type ErrorIntelligenceSliceRequestDto = z.infer<typeof errorIntelligenceSliceRequestSchema>;
export type ErrorIntelligenceSliceResponseDto = z.infer<typeof errorIntelligenceSliceResponseSchema>;