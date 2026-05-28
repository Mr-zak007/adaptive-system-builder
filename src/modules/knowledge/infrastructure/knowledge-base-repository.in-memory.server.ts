import type { KnowledgeBaseRepository } from "@/modules/knowledge/application/knowledge-base-repository";
import { operationsStore } from "@/shared/infrastructure/in-memory/operations-store.server";

export class InMemoryKnowledgeBaseRepository implements KnowledgeBaseRepository {
  async createArticle(input: {
    orgId: string;
    title: string;
    summary: string;
    bodyMarkdown: string;
    tags: string[];
  }) {
    const id = operationsStore.nextId();
    operationsStore.knowledgeArticles.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id };
  }

  async createProvenSolution(input: {
    orgId: string;
    title: string;
    problemStatement: string;
    solutionSteps: string[];
    effectivenessScore: number;
    linkedErrorCodeIds: string[];
  }) {
    const id = operationsStore.nextId();
    operationsStore.provenSolutions.push({
      ...input,
      id,
      publishedAt: operationsStore.nowIso(),
    });
    return { id, linkedErrorCodeIds: input.linkedErrorCodeIds };
  }

  async createProcedure(input: {
    orgId: string;
    title: string;
    objective: string;
    procedureSteps: string[];
  }) {
    const id = operationsStore.nextId();
    operationsStore.troubleshootingProcedures.push({ ...input, id, createdAt: operationsStore.nowIso() });
    return { id };
  }

  async search(input: { orgId: string; query: string }) {
    const q = input.query.toLowerCase();
    const articleHits = operationsStore.knowledgeArticles
      .filter((item) => item.orgId === input.orgId && (item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q)))
      .map((item) => ({ id: item.id, type: "article" as const, title: item.title, excerpt: item.summary }));
    const solutionHits = operationsStore.provenSolutions
      .filter((item) => item.orgId === input.orgId && (item.title.toLowerCase().includes(q) || item.problemStatement.toLowerCase().includes(q)))
      .map((item) => ({ id: item.id, type: "solution" as const, title: item.title, excerpt: item.problemStatement }));
    const procedureHits = operationsStore.troubleshootingProcedures
      .filter((item) => item.orgId === input.orgId && (item.title.toLowerCase().includes(q) || item.objective.toLowerCase().includes(q)))
      .map((item) => ({ id: item.id, type: "procedure" as const, title: item.title, excerpt: item.objective }));
    return [...articleHits, ...solutionHits, ...procedureHits].slice(0, 20);
  }
}