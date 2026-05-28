import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { validateTicketLifecycleVerticalSlice } from "@/modules/shared-orchestration/contracts/vertical-slice-validation.functions";
import {
  workflowFormSchema,
  validateWorkflowRequest,
  type WorkflowFormModel,
} from "@/modules/shared-orchestration/ui/vertical-slice-workflow.contracts";
import { mapWorkflowFormToRequest } from "@/modules/shared-orchestration/ui/vertical-slice-workflow.mapper";
import type { VerticalSliceValidationResponseDto } from "@/modules/shared-orchestration/contracts/vertical-slice-validation.contracts";

type AsyncStatus = "idle" | "loading" | "success" | "error";

interface WorkflowUiState {
  status: AsyncStatus;
  errorMessage: string | null;
  result: VerticalSliceValidationResponseDto | null;
  lastPayload: WorkflowFormModel | null;
  startedAt: number | null;
  completedAt: number | null;
}

const initialState: WorkflowUiState = {
  status: "idle",
  errorMessage: null,
  result: null,
  lastPayload: null,
  startedAt: null,
  completedAt: null,
};

export function useVerticalSliceWorkflow() {
  const callValidation = useServerFn(validateTicketLifecycleVerticalSlice);
  const [state, setState] = React.useState<WorkflowUiState>(initialState);

  const run = React.useCallback(
    async (formModel: WorkflowFormModel) => {
      const parsedForm = workflowFormSchema.safeParse(formModel);
      if (!parsedForm.success) {
        setState((previous) => ({
          ...previous,
          status: "error",
          errorMessage: parsedForm.error.issues[0]?.message ?? "Invalid request payload.",
          result: null,
        }));
        return;
      }

      const payload = mapWorkflowFormToRequest(parsedForm.data);
      const parsedRequest = validateWorkflowRequest(payload);
      if (!parsedRequest.success) {
        setState((previous) => ({
          ...previous,
          status: "error",
          errorMessage: parsedRequest.error.issues[0]?.message ?? "Contract validation failed.",
          result: null,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        status: "loading",
        errorMessage: null,
        result: null,
        lastPayload: parsedForm.data,
        startedAt: Date.now(),
        completedAt: null,
      }));

      try {
        const result = await callValidation({ data: parsedRequest.data });
        setState((previous) => ({
          ...previous,
          status: "success",
          result,
          completedAt: Date.now(),
        }));
      } catch (error) {
        setState((previous) => ({
          ...previous,
          status: "error",
          errorMessage: error instanceof Error ? error.message : "Workflow execution failed.",
          completedAt: Date.now(),
        }));
      }
    },
    [callValidation],
  );

  const retry = React.useCallback(async () => {
    if (!state.lastPayload || state.status === "loading") {
      return;
    }
    await run(state.lastPayload);
  }, [run, state.lastPayload, state.status]);

  const durationMs = React.useMemo(() => {
    if (!state.startedAt || !state.completedAt) {
      return null;
    }
    return Math.max(0, state.completedAt - state.startedAt);
  }, [state.completedAt, state.startedAt]);

  return {
    state,
    run,
    retry,
    durationMs,
  };
}
