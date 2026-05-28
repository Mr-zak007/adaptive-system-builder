import { createServerFn } from "@tanstack/react-start";
import { publishSolutionUseCaseRequestSchema } from "@/shared/contracts/api/use-case-contracts";

export const publishSolution = createServerFn({ method: "POST" })
  .inputValidator((data) => publishSolutionUseCaseRequestSchema.parse(data))
  .handler(async () => {
    throw new Error("NOT_IMPLEMENTED: bind publishSolution application service adapter");
  });