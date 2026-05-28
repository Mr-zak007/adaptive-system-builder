import type { VerticalSliceValidationRequestDto } from "@/modules/shared-orchestration/contracts/vertical-slice-validation.contracts";
import type { WorkflowFormModel } from "@/modules/shared-orchestration/ui/vertical-slice-workflow.contracts";

export const workflowFormDefaults: WorkflowFormModel = {
  orgId: "11111111-1111-1111-1111-111111111111",
  actorUserId: "22222222-2222-2222-2222-222222222222",
  actorRole: "dispatcher",
  includeFailureScenarios: true,
  stressLevel: "intensive",
  ticketTitle: "Field outage ticket",
  ticketDescription: "Technician reported intermittent inverter outage at site A-17.",
  ticketPriority: "high",
  assigneeUserId: "33333333-3333-3333-3333-333333333333",
  assignmentReason: "Nearest certified technician for this equipment class.",
  taskTitle: "Inspect inverter and submit evidence",
  taskInstructions: "Perform voltage check, capture panel photo, and log corrective action.",
  attachmentOwnerType: "field_task",
  attachmentFileName: "inverter-panel.jpg",
  attachmentMimeType: "image/jpeg",
  attachmentSizeBytes: 251000,
  attachmentChecksumSha256: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  attachmentStorageProvider: "lovable_storage",
  attachmentStorageKey: "org/11111111-1111-1111-1111-111111111111/task/evidence/inverter-panel.jpg",
  resolutionSummary: "Issue resolved after connector reseat and stability verification.",
  errorCodeId: "44444444-4444-4444-4444-444444444444",
  errorConfidence: 87,
  errorSource: "field_diagnostics",
};

export function mapWorkflowFormToRequest(
  input: WorkflowFormModel,
): VerticalSliceValidationRequestDto {
  return {
    orgId: input.orgId,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    includeFailureScenarios: input.includeFailureScenarios,
    stressLevel: input.stressLevel,
    workflowInput: {
      ticketIntake: {
        title: input.ticketTitle,
        description: input.ticketDescription,
        priority: input.ticketPriority,
      },
      assignment: {
        assigneeUserId: input.assigneeUserId,
        reason: input.assignmentReason,
      },
      fieldTask: {
        title: input.taskTitle,
        instructions: input.taskInstructions,
      },
      attachment: {
        ownerType: input.attachmentOwnerType,
        fileName: input.attachmentFileName,
        mimeType: input.attachmentMimeType,
        sizeBytes: input.attachmentSizeBytes,
        checksumSha256: input.attachmentChecksumSha256,
        storageProvider: input.attachmentStorageProvider,
        storageKey: input.attachmentStorageKey,
      },
      resolution: {
        summary: input.resolutionSummary,
      },
      errorCodeLinking: {
        errorCodeId: input.errorCodeId,
        confidence: input.errorConfidence,
        source: input.errorSource,
      },
    },
  };
}
