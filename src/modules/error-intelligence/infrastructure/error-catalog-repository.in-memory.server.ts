import type { ErrorCatalogRepository } from "@/modules/error-intelligence/application/error-catalog-repository";
import { operationsStore } from "@/shared/infrastructure/in-memory/operations-store.server";

export class InMemoryErrorCatalogRepository implements ErrorCatalogRepository {
  async createErrorCode(input: {
    orgId: string;
    code: string;
    title: string;
    details: string;
    severity: "low" | "medium" | "high" | "critical";
    relatedSolutionIds: string[];
    linkedTicketIds: string[];
  }) {
    const id = operationsStore.nextId();
    operationsStore.errorCodes.push({
      id,
      orgId: input.orgId,
      code: input.code,
      title: input.title,
      details: input.details,
      severity: input.severity,
      relatedSolutionIds: input.relatedSolutionIds,
      linkedTicketIds: input.linkedTicketIds,
      createdAt: operationsStore.nowIso(),
    });

    return { id, relatedSolutionIds: input.relatedSolutionIds };
  }

  async linkTicket(input: { orgId: string; errorCodeId: string; ticketId: string }) {
    const found = operationsStore.errorCodes.find(
      (row) => row.id === input.errorCodeId && row.orgId === input.orgId,
    );
    if (!found) {
      throw new Error("ERROR_CODE_NOT_FOUND");
    }

    if (!found.linkedTicketIds.includes(input.ticketId)) {
      found.linkedTicketIds.push(input.ticketId);
    }
  }

  async getStatistics(orgId: string) {
    const scoped = operationsStore.errorCodes.filter((row) => row.orgId === orgId);
    const linkedTicketSet = new Set(scoped.flatMap((row) => row.linkedTicketIds));
    const linkedSolutionSet = new Set(scoped.flatMap((row) => row.relatedSolutionIds));
    return {
      totalErrorCodes: scoped.length,
      linkedTickets: linkedTicketSet.size,
      linkedSolutions: linkedSolutionSet.size,
    };
  }
}