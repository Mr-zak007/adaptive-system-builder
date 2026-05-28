export interface InstallationSliceRepository {
  createProject(input: {
    orgId: string;
    name: string;
    siteName: string;
    lifecycle: "planned" | "active" | "handover" | "completed";
  }): Promise<{ id: string; lifecycle: "planned" | "active" | "handover" | "completed" }>;
  transitionLifecycle(input: {
    orgId: string;
    projectId: string;
    toLifecycle: "planned" | "active" | "handover" | "completed";
  }): Promise<{ lifecycle: "planned" | "active" | "handover" | "completed" }>;
  createTask(input: {
    orgId: string;
    projectId: string;
    title: string;
    status: "pending" | "in_progress" | "done";
    assignedTo: string;
  }): Promise<{ id: string }>;
  createDocument(input: {
    orgId: string;
    projectId: string;
    fileName: string;
    fileType: string;
  }): Promise<{ id: string }>;
}