import { createServerFn } from "@tanstack/react-start";
import { scheduleFieldTaskUseCaseRequestSchema } from "@/shared/contracts/api/use-case-contracts";

export const scheduleFieldTask = createServerFn({ method: "POST" })
  .inputValidator((data) => scheduleFieldTaskUseCaseRequestSchema.parse(data))
  .handler(async () => {
    throw new Error("NOT_IMPLEMENTED: bind scheduleFieldTask application service adapter");
  });