import { createServerFn } from "@tanstack/react-start";
import {
  knowledgeBaseSliceRequestSchema,
  knowledgeBaseSliceResponseSchema,
} from "@/modules/knowledge/contracts/knowledge-base.contracts";
import { KnowledgeBaseService } from "@/modules/knowledge/application/knowledge-base-service";
import { InMemoryKnowledgeBaseRepository } from "@/modules/knowledge/infrastructure/knowledge-base-repository.in-memory.server";

export const runKnowledgeBaseSlice = createServerFn({ method: "POST" })
  .inputValidator((data) => knowledgeBaseSliceRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const service = new KnowledgeBaseService(new InMemoryKnowledgeBaseRepository());
    const response = await service.runSlice(data);
    return knowledgeBaseSliceResponseSchema.parse(response);
  });