import type { ErrorCatalogRepository } from "@/modules/error-intelligence/application/error-catalog-repository";
import {
  errorIntelligenceSliceRequestSchema,
  type ErrorIntelligenceSliceResponseDto,
} from "@/modules/error-intelligence/contracts/error-intelligence-catalog.contracts";
import {
  assertErrorCodeFormat,
  assertErrorSeverity,
} from "@/modules/error-intelligence/domain/error-intelligence-invariants";

export class ErrorIntelligenceSliceService {
  constructor(private readonly repository: ErrorCatalogRepository) {}

  async runSlice(input: unknown): Promise<ErrorIntelligenceSliceResponseDto> {
    const parsed = errorIntelligenceSliceRequestSchema.parse(input);

    assertErrorCodeFormat(parsed.errorCode.code);
    assertErrorSeverity(parsed.errorCode.severity);

    const created = await this.repository.createErrorCode({
      orgId: parsed.orgId,
      code: parsed.errorCode.code,
      title: parsed.errorCode.title,
      details: parsed.errorCode.details,
      severity: parsed.errorCode.severity,
      relatedSolutionIds: parsed.errorCode.relatedSolutionIds,
      linkedTicketIds: parsed.errorCode.linkedTicketIds,
    });

    await this.repository.linkTicket({
      orgId: parsed.orgId,
      errorCodeId: created.id,
      ticketId: parsed.linkTicketId,
    });

    const statistics = await this.repository.getStatistics(parsed.orgId);

    return {
      errorCodeId: created.id,
      linkedTicketId: parsed.linkTicketId,
      relatedSolutions: created.relatedSolutionIds,
      statistics,
    };
  }
}