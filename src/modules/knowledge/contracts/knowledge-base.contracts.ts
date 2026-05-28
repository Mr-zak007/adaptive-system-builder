import { z } from "zod";

export const knowledgeArticleInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  summary: z.string().trim().min(3).max(500),
  bodyMarkdown: z.string().trim().min(10).max(10000),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
});

export const provenSolutionInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  problemStatement: z.string().trim().min(5).max(2000),
  solutionSteps: z.array(z.string().trim().min(1).max(1000)).min(1).max(30),
  effectivenessScore: z.number().int().min(0).max(100),
  linkedErrorCodeIds: z.array(z.string().uuid()).max(20),
});

export const troubleshootingProcedureInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  objective: z.string().trim().min(5).max(1000),
  procedureSteps: z.array(z.string().trim().min(1).max(1000)).min(1).max(40),
});

export const knowledgeSearchInputSchema = z.object({
  query: z.string().trim().min(1).max(200),
});

export const knowledgeBaseSliceRequestSchema = z.object({
  orgId: z.string().uuid(),
  article: knowledgeArticleInputSchema,
  provenSolution: provenSolutionInputSchema,
  troubleshootingProcedure: troubleshootingProcedureInputSchema,
  search: knowledgeSearchInputSchema,
});

export const knowledgeSearchResultSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["article", "solution", "procedure"]),
  title: z.string(),
  excerpt: z.string(),
});

export const knowledgeBaseSliceResponseSchema = z.object({
  articleId: z.string().uuid(),
  solutionId: z.string().uuid(),
  procedureId: z.string().uuid(),
  searchResults: z.array(knowledgeSearchResultSchema),
  linkedErrorCodeIds: z.array(z.string().uuid()),
});

export type KnowledgeBaseSliceRequestDto = z.infer<typeof knowledgeBaseSliceRequestSchema>;
export type KnowledgeBaseSliceResponseDto = z.infer<typeof knowledgeBaseSliceResponseSchema>;