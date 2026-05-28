import type { KnowledgeBaseRepository } from "@/modules/knowledge/application/knowledge-base-repository";
import {
  knowledgeBaseSliceRequestSchema,
  type KnowledgeBaseSliceResponseDto,
} from "@/modules/knowledge/contracts/knowledge-base.contracts";
import {
  assertKnowledgeTitle,
  assertProcedureSteps,
} from "@/modules/knowledge/domain/knowledge-base-invariants";

export class KnowledgeBaseService {
  constructor(private readonly repository: KnowledgeBaseRepository) {}

  async runSlice(input: unknown): Promise<KnowledgeBaseSliceResponseDto> {
    const parsed = knowledgeBaseSliceRequestSchema.parse(input);

    assertKnowledgeTitle(parsed.article.title);
    assertKnowledgeTitle(parsed.provenSolution.title);
    assertKnowledgeTitle(parsed.troubleshootingProcedure.title);
    assertProcedureSteps(parsed.troubleshootingProcedure.procedureSteps);

    const article = await this.repository.createArticle({
      orgId: parsed.orgId,
      title: parsed.article.title,
      summary: parsed.article.summary,
      bodyMarkdown: parsed.article.bodyMarkdown,
      tags: parsed.article.tags,
    });

    const solution = await this.repository.createProvenSolution({
      orgId: parsed.orgId,
      title: parsed.provenSolution.title,
      problemStatement: parsed.provenSolution.problemStatement,
      solutionSteps: parsed.provenSolution.solutionSteps,
      effectivenessScore: parsed.provenSolution.effectivenessScore,
      linkedErrorCodeIds: parsed.provenSolution.linkedErrorCodeIds,
    });

    const procedure = await this.repository.createProcedure({
      orgId: parsed.orgId,
      title: parsed.troubleshootingProcedure.title,
      objective: parsed.troubleshootingProcedure.objective,
      procedureSteps: parsed.troubleshootingProcedure.procedureSteps,
    });

    const searchResults = await this.repository.search({
      orgId: parsed.orgId,
      query: parsed.search.query,
    });

    return {
      articleId: article.id,
      solutionId: solution.id,
      procedureId: procedure.id,
      searchResults,
      linkedErrorCodeIds: solution.linkedErrorCodeIds,
    };
  }
}