import { publishSolutionRequestSchema } from "@/modules/knowledge/contracts/knowledge.contracts";
import { assertSolutionPublishable } from "@/modules/knowledge/domain/solution-invariants";
import type { KnowledgeRepository } from "@/modules/knowledge/application/knowledge-repository";

export interface KnowledgeDomainEventPublisher {
  publishSolutionPublished(input: {
    orgId: string;
    solutionId: string;
    publishedByUserId: string;
    version: number;
  }): Promise<void>;
}

export class KnowledgeApplicationService {
  constructor(
    private readonly knowledgeRepository: KnowledgeRepository,
    private readonly eventPublisher: KnowledgeDomainEventPublisher,
  ) {}

  async publishSolution(input: {
    orgId: string;
    actorUserId: string;
    headers: { ifMatchVersion: number };
    body: {
      solutionId: string;
      title: string;
      problemStatement: string;
      solutionSteps: string[];
      effectivenessScore?: number;
    };
  }) {
    const parsed = publishSolutionRequestSchema.parse({
      headers: input.headers,
      body: input.body,
    });

    assertSolutionPublishable({
      title: parsed.body.title,
      problemStatement: parsed.body.problemStatement,
      solutionSteps: parsed.body.solutionSteps,
    });

    const updated = await this.knowledgeRepository.publishSolution({
      orgId: input.orgId,
      solutionId: parsed.body.solutionId,
      expectedRowVersion: parsed.headers.ifMatchVersion,
      nextRowVersion: parsed.headers.ifMatchVersion + 1,
      title: parsed.body.title,
      problemStatement: parsed.body.problemStatement,
      solutionSteps: parsed.body.solutionSteps,
      effectivenessScore: parsed.body.effectivenessScore,
    });

    if (!updated) {
      throw new Error("VERSION_CONFLICT: failed to publish solution");
    }

    await this.eventPublisher.publishSolutionPublished({
      orgId: input.orgId,
      solutionId: updated.id,
      publishedByUserId: input.actorUserId,
      version: updated.rowVersion,
    });

    return {
      solutionId: updated.id,
      rowVersion: updated.rowVersion,
    };
  }
}