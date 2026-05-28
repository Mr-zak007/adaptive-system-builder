const allowedTaskTransitions: Record<string, Set<string>> = {
  pending: new Set(["scheduled", "canceled"]),
  scheduled: new Set(["in_progress", "canceled"]),
  in_progress: new Set(["done", "failed"]),
};

export function assertTaskTransitionAllowed(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return;
  }

  if (!allowedTaskTransitions[fromStatus]?.has(toStatus)) {
    throw new Error(`DOMAIN_INVARIANT_VIOLATION: invalid task transition ${fromStatus} -> ${toStatus}`);
  }
}