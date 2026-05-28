import { createServerFn } from "@tanstack/react-start";
import {
  errorIntelligenceSliceRequestSchema,
  errorIntelligenceSliceResponseSchema,
} from "@/modules/error-intelligence/contracts/error-intelligence-catalog.contracts";
import { ErrorIntelligenceSliceService } from "@/modules/error-intelligence/application/error-intelligence-slice-service";
import { InMemoryErrorCatalogRepository } from "@/modules/error-intelligence/infrastructure/error-catalog-repository.in-memory.server";

export const runErrorIntelligenceSlice = createServerFn({ method: "POST" })
  .inputValidator((data) => errorIntelligenceSliceRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const service = new ErrorIntelligenceSliceService(new InMemoryErrorCatalogRepository());
    const response = await service.runSlice(data);
    return errorIntelligenceSliceResponseSchema.parse(response);
  });