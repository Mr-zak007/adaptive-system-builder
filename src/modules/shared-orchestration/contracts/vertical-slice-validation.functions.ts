import { createServerFn } from "@tanstack/react-start";
import {
  verticalSliceValidationRequestSchema,
  verticalSliceValidationResponseSchema,
} from "@/modules/shared-orchestration/contracts/vertical-slice-validation.contracts";
import { runVerticalSliceValidation } from "@/modules/shared-orchestration/application/vertical-slice-validation.service";
import { createInMemoryVerticalSliceValidationDeps } from "@/modules/shared-orchestration/infrastructure/validation-harness.server";

export const validateTicketLifecycleVerticalSlice = createServerFn({ method: "POST" })
  .inputValidator((data) => verticalSliceValidationRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const deps = createInMemoryVerticalSliceValidationDeps();
    const response = await runVerticalSliceValidation(deps, data);
    return verticalSliceValidationResponseSchema.parse(response);
  });