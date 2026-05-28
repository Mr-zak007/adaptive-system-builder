import { z } from "zod";

export const linkErrorCodeRequestSchema = z.object({
  body: z.object({
    ticketId: z.string().uuid(),
    errorCodeId: z.string().uuid(),
    confidence: z.number().min(0).max(100).optional(),
    source: z.string().trim().max(100).optional(),
  }),
});

export const linkErrorCodeResponseSchema = z.object({
  ticketId: z.string().uuid(),
  errorCodeId: z.string().uuid(),
  linkedAt: z.string().datetime(),
});

export type LinkErrorCodeRequestDto = z.infer<typeof linkErrorCodeRequestSchema>;
export type LinkErrorCodeResponseDto = z.infer<typeof linkErrorCodeResponseSchema>;