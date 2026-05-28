import type { InstallationSliceRepository } from "@/modules/installations/application/installation-slice-repository";
import {
  installationSliceRequestSchema,
  type InstallationSliceResponseDto,
} from "@/modules/installations/contracts/installation-projects.contracts";
import { assertLifecycleTransition } from "@/modules/installations/domain/installation-invariants";

export class InstallationSliceService {
  constructor(private readonly repository: InstallationSliceRepository) {}

  async runSlice(input: unknown): Promise<InstallationSliceResponseDto> {
    const parsed = installationSliceRequestSchema.parse(input);

    const project = await this.repository.createProject({
      orgId: parsed.orgId,
      name: parsed.project.name,
      siteName: parsed.project.siteName,
      lifecycle: parsed.project.lifecycle,
    });

    assertLifecycleTransition(project.lifecycle, parsed.moveToLifecycle);
    const transitioned = await this.repository.transitionLifecycle({
      orgId: parsed.orgId,
      projectId: project.id,
      toLifecycle: parsed.moveToLifecycle,
    });

    const task = await this.repository.createTask({
      orgId: parsed.orgId,
      projectId: project.id,
      title: parsed.task.title,
      status: parsed.task.status,
      assignedTo: parsed.task.assignedTo,
    });

    const document = await this.repository.createDocument({
      orgId: parsed.orgId,
      projectId: project.id,
      fileName: parsed.document.fileName,
      fileType: parsed.document.fileType,
    });

    return {
      projectId: project.id,
      lifecycle: transitioned.lifecycle,
      taskId: task.id,
      documentId: document.id,
    };
  }
}