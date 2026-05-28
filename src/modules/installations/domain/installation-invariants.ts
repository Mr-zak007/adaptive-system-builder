export function assertLifecycleTransition(from: string, to: string) {
  const allowed: Record<string, string[]> = {
    planned: ["active"],
    active: ["handover"],
    handover: ["completed"],
    completed: [],
  };

  if (!(allowed[from] ?? []).includes(to)) {
    throw new Error("INVALID_INSTALLATION_LIFECYCLE_TRANSITION");
  }
}