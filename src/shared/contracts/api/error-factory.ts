export type ContractErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VERSION_CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "DOMAIN_INVARIANT_VIOLATION"
  | "INTERNAL_ERROR";

export interface ContractErrorResponse {
  error: {
    code: ContractErrorCode;
    message: string;
    requestId: string;
    details?: Record<string, unknown>;
  };
}

export function createContractError(input: {
  code: ContractErrorCode;
  message: string;
  requestId: string;
  details?: Record<string, unknown>;
}): ContractErrorResponse {
  return {
    error: {
      code: input.code,
      message: input.message,
      requestId: input.requestId,
      details: input.details,
    },
  };
}