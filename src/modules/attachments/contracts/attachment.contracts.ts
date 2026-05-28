import { z } from "zod";

export const attachmentOwnerTypeSchema = z.enum([
  "ticket",
  "field_task",
  "solution",
  "installation_project",
  "knowledge_article",
  "procedure",
]);

export const registerAttachmentRequestSchema = z.object({
  body: z.object({
    ownerType: attachmentOwnerTypeSchema,
    ownerId: z.string().uuid(),
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().min(3).max(100),
    sizeBytes: z.number().int().nonnegative().max(2147483648),
    checksumSha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
    storageProvider: z.string().trim().min(1).max(50),
    storageKey: z.string().trim().min(1).max(500),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const registerAttachmentResponseSchema = z.object({
  attachmentId: z.string().uuid(),
  status: z.enum(["uploaded", "processing", "ready", "failed", "deleted"]),
  ownerType: attachmentOwnerTypeSchema,
  ownerId: z.string().uuid(),
});

export type RegisterAttachmentRequestDto = z.infer<typeof registerAttachmentRequestSchema>;
export type RegisterAttachmentResponseDto = z.infer<typeof registerAttachmentResponseSchema>;