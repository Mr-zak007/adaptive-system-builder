import { createServerFn } from "@tanstack/react-start";
import { assignTicketUseCaseRequestSchema, resolveTicketUseCaseRequestSchema } from "@/shared/contracts/api/use-case-contracts";

export const assignTicket = createServerFn({ method: "POST" })
  .inputValidator((data) => assignTicketUseCaseRequestSchema.parse(data))
  .handler(async () => {
    throw new Error("NOT_IMPLEMENTED: bind assignTicket application service adapter");
  });

export const resolveTicket = createServerFn({ method: "POST" })
  .inputValidator((data) => resolveTicketUseCaseRequestSchema.parse(data))
  .handler(async () => {
    throw new Error("NOT_IMPLEMENTED: bind resolveTicket application service adapter");
  });