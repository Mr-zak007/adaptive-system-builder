const allowedTicketTransitions: Record<string, Set<string>> = {
  open: new Set(["triaged"]),
  triaged: new Set(["assigned"]),
  assigned: new Set(["in_progress", "blocked"]),
  in_progress: new Set(["blocked", "resolved"]),
  blocked: new Set(["in_progress"]),
  resolved: new Set(["closed", "in_progress"]),
  closed: new Set(["in_progress"]),
};

export function assertTicketTransitionAllowed(fromStatus: string, toStatus: string) {
  if (fromStatus === toStatus) {
    return;
  }

  if (!allowedTicketTransitions[fromStatus]?.has(toStatus)) {
    throw new Error(`DOMAIN_INVARIANT_VIOLATION: invalid ticket transition ${fromStatus} -> ${toStatus}`);
  }
}