import { z } from "zod";

export const installationProjectInputSchema = z.object({
  name: z.string().trim().min(3).max(200),
  siteName: z.string().trim().min(3).max(200),
  lifecycle: z.enum(["planned", "active", "handover", "completed"]),
});

export const installationTaskInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  status: z.enum(["pending", "in_progress", "done"]),
  assignedTo: z.string().uuid(),
});

export const installationDocumentInputSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  fileType: z.string().trim().min(1).max(100),
});

export const installationSliceRequestSchema = z.object({
  orgId: z.string().uuid(),
  project: installationProjectInputSchema,
  task: installationTaskInputSchema,
  document: installationDocumentInputSchema,
  moveToLifecycle: z.enum(["planned", "active", "handover", "completed"]),
});

export const installationSliceResponseSchema = z.object({
  projectId: z.string().uuid(),
  lifecycle: z.enum(["planned", "active", "handover", "completed"]),
  taskId: z.string().uuid(),
  documentId: z.string().uuid(),
});

export type InstallationSliceRequestDto = z.infer<typeof installationSliceRequestSchema>;
export type InstallationSliceResponseDto = z.infer<typeof installationSliceResponseSchema>;