import { z } from "zod";

export type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export const verticalSliceValidationRequestSchema = z.object({
  orgId: z.string().uuid(),
  actorUserId: z.string().uuid(),
  actorRole: z.enum([
    "admin",
    "dispatcher",
    "field_technician",
    "support_engineer",
    "knowledge_manager",
    "viewer",
  ]),
  includeFailureScenarios: z.boolean().default(true),
  stressLevel: z.enum(["baseline", "intensive"]).default("intensive"),
});

export const scenarioResultSchema = z.object({
  scenario: z.string().min(1).max(120),
  status: z.enum(["passed", "failed", "warning"]),
  message: z.string().min(1).max(500),
  evidence: z.record(z.string(), jsonValueSchema).default({}),
});

export const verticalSliceValidationResponseSchema = z.object({
  requestId: z.string().uuid(),
  correlationId: z.string().uuid(),
  summary: z.object({
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    warnings: z.number().int().nonnegative(),
  }),
  lifecycle: z.array(scenarioResultSchema),
  failureScenarios: z.array(scenarioResultSchema),
  concurrencyStressValidation: z.array(scenarioResultSchema),
  eventOutboxStressValidation: z.array(scenarioResultSchema),
  attachmentLifecycleValidation: z.array(scenarioResultSchema),
  transactionBoundaryValidation: z.array(scenarioResultSchema),
  observability: z.object({
    logCount: z.number().int().nonnegative(),
    transactionCount: z.number().int().nonnegative(),
    eventTraceCount: z.number().int().nonnegative(),
    errorClasses: z.array(z.string()),
    failureClassificationCoverage: z.number().min(0).max(1),
    correlationCoverage: z.number().min(0).max(1),
    retryVisibilityCoverage: z.number().min(0).max(1),
  }),
  observabilityValidation: z.array(scenarioResultSchema),
  performanceValidation: z.array(scenarioResultSchema),
  architecturalFitnessValidation: z.array(scenarioResultSchema),
  repositoryAndDbValidation: z.array(scenarioResultSchema),
  authorizationValidation: z.array(scenarioResultSchema),
  dtoMappingValidation: z.array(scenarioResultSchema),
  architecturalReview: z.object({
    currentRisks: z.array(z.string()),
    whatWorked: z.array(z.string()),
    weakBoundaries: z.array(z.string()),
    scalingConcerns: z.array(z.string()),
    highestRiskModules: z.array(z.string()),
    earlyRefactors: z.array(z.string()),
    unclearBoundaries: z.array(z.string()),
    couplingsDetected: z.array(z.string()),
    performanceRisks: z.array(z.string()),
    scalingRisks: z.array(z.string()),
  }),
});

export type VerticalSliceValidationRequestDto = z.infer<typeof verticalSliceValidationRequestSchema>;
export type VerticalSliceValidationResponseDto = z.infer<typeof verticalSliceValidationResponseSchema>;