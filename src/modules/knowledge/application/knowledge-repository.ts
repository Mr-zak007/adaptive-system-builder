export interface KnowledgeArticleRecord {
  id: string;
  orgId: string;
  title: string;
  summary: string | null;
  bodyMarkdown: string;
  rowVersion: number;
}

export interface ProvenSolutionRecord {
  id: string;
  orgId: string;
  title: string;
  problemStatement: string | null;
  solutionSteps: string[];
  effectivenessScore: number | null;
  rowVersion: number;
  publishedAt: string | null;
}

export interface TroubleshootingProcedureRecord {
  id: string;
  orgId: string;
  title: string;
  objective: string | null;
  procedureSteps: string[];
  rowVersion: number;
}

export interface KnowledgeRepository {
  findSolutionById(orgId: string, solutionId: string): Promise<ProvenSolutionRecord | null>;
  publishSolution(input: {
    orgId: string;
    solutionId: string;
    expectedRowVersion: number;
    nextRowVersion: number;
    title: string;
    problemStatement: string;
    solutionSteps: string[];
    effectivenessScore?: number;
  }): Promise<ProvenSolutionRecord | null>;
}