export interface KnowledgeBaseRepository {
  createArticle(input: {
    orgId: string;
    title: string;
    summary: string;
    bodyMarkdown: string;
    tags: string[];
  }): Promise<{ id: string }>;
  createProvenSolution(input: {
    orgId: string;
    title: string;
    problemStatement: string;
    solutionSteps: string[];
    effectivenessScore: number;
    linkedErrorCodeIds: string[];
  }): Promise<{ id: string; linkedErrorCodeIds: string[] }>;
  createProcedure(input: {
    orgId: string;
    title: string;
    objective: string;
    procedureSteps: string[];
  }): Promise<{ id: string }>;
  search(input: { orgId: string; query: string }): Promise<
    Array<{
      id: string;
      type: "article" | "solution" | "procedure";
      title: string;
      excerpt: string;
    }>
  >;
}