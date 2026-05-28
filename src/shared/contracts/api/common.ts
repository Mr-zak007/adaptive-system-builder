import { z } from "zod";

export const cursorPaginationRequestSchema = z.object({
  cursor: z.string().min(1).max(200).optional(),
  pageSize: z.number().int().min(1).max(200).default(50),
  sortBy: z.enum(["created_at", "updated_at", "last_activity_at"]).default("created_at"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export const cursorPaginationResponseSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const idempotencyHeaderSchema = z.object({
  idempotencyKey: z.string().uuid(),
});

export const optimisticConcurrencyHeaderSchema = z.object({
  ifMatchVersion: z.number().int().positive(),
});

export const apiErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VERSION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "DOMAIN_INVARIANT_VIOLATION",
  "RATE_LIMITED",
  "INTERNAL_ERROR",
]);

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string().min(1).max(500),
    requestId: z.string().min(1).max(100),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const listTicketsFilterSchema = z.object({
  status: z.array(z.enum(["open", "triaged", "assigned", "in_progress", "blocked", "resolved", "closed"]))
    .max(7)
    .optional(),
  priority: z.array(z.enum(["low", "medium", "high", "critical"])).max(4).optional(),
  assigneeUserId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(200).optional(),
});

export type CursorPaginationRequestDto = z.infer<typeof cursorPaginationRequestSchema>;
export type CursorPaginationResponseDto = z.infer<typeof cursorPaginationResponseSchema>;
export type IdempotencyHeaderDto = z.infer<typeof idempotencyHeaderSchema>;
export type OptimisticConcurrencyHeaderDto = z.infer<typeof optimisticConcurrencyHeaderSchema>;
export type ApiErrorResponseDto = z.infer<typeof apiErrorResponseSchema>;
export type ListTicketsFilterDto = z.infer<typeof listTicketsFilterSchema>;