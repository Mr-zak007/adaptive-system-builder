import { z } from "zod";
import {
  idempotencyHeaderSchema,
  optimisticConcurrencyHeaderSchema,
} from "@/shared/contracts/api/common";

export const ticketStatusSchema = z.enum([
  "open",
  "triaged",
  "assigned",
  "in_progress",
  "blocked",
  "resolved",
  "closed",
]);

export const assignTicketRequestSchema = z.object({
  headers: idempotencyHeaderSchema.merge(optimisticConcurrencyHeaderSchema),
  body: z.object({
    assigneeUserId: z.string().uuid(),
    reason: z.string().trim().min(1).max(500),
  }),
});

export const assignTicketResponseSchema = z.object({
  ticketId: z.string().uuid(),
  status: ticketStatusSchema,
  assigneeUserId: z.string().uuid(),
  rowVersion: z.number().int().positive(),
});

export const changeTicketStatusRequestSchema = z.object({
  headers: optimisticConcurrencyHeaderSchema,
  body: z.object({
    toStatus: ticketStatusSchema,
    reason: z.string().trim().min(1).max(500),
  }),
});

export const changeTicketStatusResponseSchema = z.object({
  ticketId: z.string().uuid(),
  fromStatus: ticketStatusSchema,
  toStatus: ticketStatusSchema,
  rowVersion: z.number().int().positive(),
});

export type AssignTicketRequestDto = z.infer<typeof assignTicketRequestSchema>;
export type AssignTicketResponseDto = z.infer<typeof assignTicketResponseSchema>;
export type ChangeTicketStatusRequestDto = z.infer<typeof changeTicketStatusRequestSchema>;
export type ChangeTicketStatusResponseDto = z.infer<typeof changeTicketStatusResponseSchema>;