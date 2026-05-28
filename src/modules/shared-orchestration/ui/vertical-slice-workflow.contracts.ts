import { z } from "zod";
import {
  verticalSliceValidationRequestSchema,
  type VerticalSliceValidationRequestDto,
} from "@/modules/shared-orchestration/contracts/vertical-slice-validation.contracts";

export const workflowFormSchema = z.object({
  orgId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum(["admin", "dispatcher", "field_technician", "support_engineer", "knowledge_manager", "viewer"]),
  includeFailureScenarios: z.boolean(),
  stressLevel: z.enum(["baseline", "intensive"]),
  ticketTitle: z.string().trim().min(3).max(200),
  ticketDescription: z.string().trim().min(5).max(2000),
  ticketPriority: z.enum(["low", "medium", "high", "critical"]),
  assigneeUserId: z.string().uuid(),
  assignmentReason: z.string().trim().min(1).max(500),
  taskTitle: z.string().trim().min(3).max(200),
  taskInstructions: z.string().trim().min(1).max(2000),
  attachmentOwnerType: z.enum(["ticket", "field_task"]),
  attachmentFileName: z.string().trim().min(1).max(255),
  attachmentMimeType: z.string().trim().min(3).max(100),
  attachmentSizeBytes: z.number().int().positive().max(2147483648),
  attachmentChecksumSha256: z.string().regex(/^[A-Fa-f0-9]{64}$/),
  attachmentStorageProvider: z.string().trim().min(1).max(50),
  attachmentStorageKey: z.string().trim().min(1).max(500),
  resolutionSummary: z.string().trim().min(3).max(2000),
  errorCodeId: z.string().uuid(),
  errorConfidence: z.number().min(0).max(100).optional(),
  errorSource: z.string().trim().max(100).optional(),
});

export type WorkflowFormModel = z.infer<typeof workflowFormSchema>;

export function validateWorkflowRequest(dto: VerticalSliceValidationRequestDto) {
  return verticalSliceValidationRequestSchema.safeParse(dto);
}