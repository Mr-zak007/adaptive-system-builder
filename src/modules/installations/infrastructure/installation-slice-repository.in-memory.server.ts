import type { InstallationSliceRepository } from "@/modules/installations/application/installation-slice-repository";
import { operationsStore } from "@/shared/infrastructure/in-memory/operations-store.server";

export class InMemoryInstallationSliceRepository implements InstallationSliceRepository {
  async createProject(input: {
    orgId: string;
    name: string;
    siteName: string;
    lifecycle: "planned" | "active" | "handover" | "completed";
  }) {
    const id = operationsStore.nextId();
    operationsStore.installationProjects.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id, lifecycle: input.lifecycle };
  }

  async transitionLifecycle(input: {
    orgId: string;
    projectId: string;
    toLifecycle: "planned" | "active" | "handover" | "completed";
  }) {
    const found = operationsStore.installationProjects.find(
      (row) => row.id === input.projectId && row.orgId === input.orgId,
    );
    if (!found) {
      throw new Error("INSTALLATION_PROJECT_NOT_FOUND");
    }

    found.lifecycle = input.toLifecycle;
    return { lifecycle: found.lifecycle };
  }

  async createTask(input: {
    orgId: string;
    projectId: string;
    title: string;
    status: "pending" | "in_progress" | "done";
    assignedTo: string;
  }) {
    const id = operationsStore.nextId();
    operationsStore.installationTasks.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id };
  }

  async createDocument(input: {
    orgId: string;
    projectId: string;
    fileName: string;
    fileType: string;
  }) {
    const id = operationsStore.nextId();
    operationsStore.installationDocuments.push({ ...input, id, uploadedAt: operationsStore.nowIso() });
    return { id };
  }
}