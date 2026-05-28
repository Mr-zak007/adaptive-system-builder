import { z } from "zod";

export const ticketCreatedEventSchema = z.object({
  eventName: z.literal("ticket.created"),
  eventId: z.string().uuid(),
  orgId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  payload: z.object({
    ticketId: z.string().uuid(),
    createdByUserId: z.string().uuid(),
    title: z.string().min(1).max(200),
    priority: z.enum(["low", "medium", "high", "critical"]),
  }),
});

export const ticketAssignedEventSchema = z.object({
  eventName: z.literal("ticket.assigned"),
  eventId: z.string().uuid(),
  orgId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  payload: z.object({
    ticketId: z.string().uuid(),
    assigneeUserId: z.string().uuid(),
    previousAssigneeUserId: z.string().uuid().nullable(),
    assignedByUserId: z.string().uuid(),
    rowVersion: z.number().int().positive(),
  }),
});

export const taskCompletedEventSchema = z.object({
  eventName: z.literal("task.completed"),
  eventId: z.string().uuid(),
  orgId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  payload: z.object({
    taskId: z.string().uuid(),
    ticketId: z.string().uuid(),
    completedByUserId: z.string().uuid(),
    outcome: z.enum(["success", "failed"]),
    completionNotes: z.string().max(2000).optional(),
  }),
});

export const solutionPublishedEventSchema = z.object({
  eventName: z.literal("solution.published"),
  eventId: z.string().uuid(),
  orgId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  payload: z.object({
    solutionId: z.string().uuid(),
    publishedByUserId: z.string().uuid(),
    version: z.number().int().positive(),
  }),
});

export const attachmentUploadedEventSchema = z.object({
  eventName: z.literal("attachment.uploaded"),
  eventId: z.string().uuid(),
  orgId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  payload: z.object({
    attachmentId: z.string().uuid(),
    ownerType: z.enum(["ticket", "field_task", "solution", "installation_project", "knowledge_article", "procedure"]),
    ownerId: z.string().uuid(),
    storageProvider: z.string().min(1).max(50),
    storageKey: z.string().min(1).max(500),
    sizeBytes: z.number().int().nonnegative(),
  }),
});

export const escalationTriggeredEventSchema = z.object({
  eventName: z.literal("escalation.triggered"),
  eventId: z.string().uuid(),
  orgId: z.string().uuid(),
  occurredAt: z.string().datetime(),
  payload: z.object({
    ticketId: z.string().uuid(),
    timerId: z.string().uuid(),
    timerType: z.enum(["response", "escalation", "overdue"]),
    breachedAt: z.string().datetime(),
  }),
});

export const domainEventEnvelopeSchema = z.discriminatedUnion("eventName", [
  ticketCreatedEventSchema,
  ticketAssignedEventSchema,
  taskCompletedEventSchema,
  solutionPublishedEventSchema,
  attachmentUploadedEventSchema,
  escalationTriggeredEventSchema,
]);

export type DomainEventEnvelope = z.infer<typeof domainEventEnvelopeSchema>;