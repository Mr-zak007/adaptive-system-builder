export function assertSolutionPublishable(input: {
  title: string;
  problemStatement: string;
  solutionSteps: string[];
}) {
  if (!input.title.trim()) {
    throw new Error("DOMAIN_INVARIANT_VIOLATION: solution title is required");
  }

  if (!input.problemStatement.trim()) {
    throw new Error("DOMAIN_INVARIANT_VIOLATION: problem statement is required");
  }

  if (input.solutionSteps.length === 0) {
    throw new Error("DOMAIN_INVARIANT_VIOLATION: at least one solution step is required");
  }
}