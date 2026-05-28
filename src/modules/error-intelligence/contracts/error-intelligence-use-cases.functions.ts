import { createServerFn } from "@tanstack/react-start";
import { attachErrorCodeUseCaseRequestSchema } from "@/shared/contracts/api/use-case-contracts";

export const attachErrorCode = createServerFn({ method: "POST" })
  .inputValidator((data) => attachErrorCodeUseCaseRequestSchema.parse(data))
  .handler(async () => {
    throw new Error("NOT_IMPLEMENTED: bind attachErrorCode application service adapter");
  });