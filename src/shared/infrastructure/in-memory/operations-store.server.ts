import { randomUUID } from "node:crypto";

export interface KnowledgeArticle {
  id: string;
  orgId: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  createdAt: string;
}

export interface ProvenSolution {
  id: string;
  orgId: string;
  title: string;
  problemStatement: string;
  solutionSteps: string[];
  effectivenessScore: number;
  linkedErrorCodeIds: string[];
  publishedAt: string;
}

export interface TroubleshootingProcedure {
  id: string;
  orgId: string;
  title: string;
  objective: string;
  procedureSteps: string[];
  createdAt: string;
}

export interface ErrorCodeCatalogItem {
  id: string;
  orgId: string;
  code: string;
  title: string;
  details: string;
  severity: "low" | "medium" | "high" | "critical";
  relatedSolutionIds: string[];
  linkedTicketIds: string[];
  createdAt: string;
}

export interface InstallationProject {
  id: string;
  orgId: string;
  name: string;
  siteName: string;
  lifecycle: "planned" | "active" | "handover" | "completed";
  createdAt: string;
}

export interface InstallationTask {
  id: string;
  orgId: string;
  projectId: string;
  title: string;
  status: "pending" | "in_progress" | "done";
  assignedTo: string;
  createdAt: string;
}

export interface InstallationDocument {
  id: string;
  orgId: string;
  projectId: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
}

export interface ProductBrand {
  id: string;
  orgId: string;
  name: string;
  createdAt: string;
}

export interface ProductModel {
  id: string;
  orgId: string;
  brandId: string;
  name: string;
  specifications: Record<string, string>;
  componentModelIds: string[];
  createdAt: string;
}

export interface ClientProfile {
  id: string;
  orgId: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface SolarSystemProfile {
  id: string;
  orgId: string;
  clientId: string;
  systemName: string;
  location: string;
  createdAt: string;
}

export interface SolarComponent {
  id: string;
  orgId: string;
  systemId: string;
  componentType: string;
  serialNumber: string;
  status: "active" | "maintenance" | "retired";
  createdAt: string;
}

export interface SolarHistoryEvent {
  id: string;
  orgId: string;
  systemId: string;
  eventType: string;
  note: string;
  occurredAt: string;
}

class OperationsStore {
  knowledgeArticles: KnowledgeArticle[] = [];
  provenSolutions: ProvenSolution[] = [];
  troubleshootingProcedures: TroubleshootingProcedure[] = [];
  errorCodes: ErrorCodeCatalogItem[] = [];
  installationProjects: InstallationProject[] = [];
  installationTasks: InstallationTask[] = [];
  installationDocuments: InstallationDocument[] = [];
  productBrands: ProductBrand[] = [];
  productModels: ProductModel[] = [];
  clientProfiles: ClientProfile[] = [];
  solarSystems: SolarSystemProfile[] = [];
  solarComponents: SolarComponent[] = [];
  solarHistory: SolarHistoryEvent[] = [];

  nextId() {
    return randomUUID();
  }

  nowIso() {
    return new Date().toISOString();
  }
}

export const operationsStore = new OperationsStore();