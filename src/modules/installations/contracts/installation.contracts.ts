import { z } from "zod";
import { optimisticConcurrencyHeaderSchema } from "@/shared/contracts/api/common";

export const installationStatusSchema = z.enum(["planned", "active", "paused", "completed", "canceled"]);

export const updateInstallationWorkflowRequestSchema = z.object({
  headers: optimisticConcurrencyHeaderSchema,
  body: z.object({
    projectId: z.string().uuid(),
    toStatus: installationStatusSchema,
    note: z.string().trim().max(1000).optional(),
  }),
});

export const updateInstallationWorkflowResponseSchema = z.object({
  projectId: z.string().uuid(),
  status: installationStatusSchema,
  rowVersion: z.number().int().positive(),
});

export type UpdateInstallationWorkflowRequestDto = z.infer<typeof updateInstallationWorkflowRequestSchema>;
export type UpdateInstallationWorkflowResponseDto = z.infer<typeof updateInstallationWorkflowResponseSchema>;