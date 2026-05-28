export function assertKnowledgeTitle(title: string) {
  if (!title.trim() || title.trim().length < 3) {
    throw new Error("INVALID_KNOWLEDGE_TITLE");
  }
}

export function assertProcedureSteps(steps: string[]) {
  if (steps.length === 0 || steps.some((step) => !step.trim())) {
    throw new Error("INVALID_PROCEDURE_STEPS");
  }
}