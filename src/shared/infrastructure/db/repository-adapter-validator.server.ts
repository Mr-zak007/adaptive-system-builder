export interface RepositoryValidationResult {
  boundariesRespected: boolean;
  noHiddenOrmLeakage: boolean;
  transactionsRespected: boolean;
  deterministicPagination: boolean;
  stableFiltering: boolean;
  notes: string[];
}

export interface RepositoryAdapterValidator {
  validate(): Promise<RepositoryValidationResult>;
}

export class StaticRepositoryAdapterValidator implements RepositoryAdapterValidator {
  constructor(private readonly sourceText: string) {}

  async validate(): Promise<RepositoryValidationResult> {
    const normalized = this.sourceText.toLowerCase();

    const forbiddenOrmTokens = ["typeorm", "prisma", "sequelize", "knex"]; // hidden leakage detector
    const forbiddenOrmLeak = forbiddenOrmTokens.some((token) => normalized.includes(token));

    const hasTransactionBoundary = normalized.includes("runintransaction") || normalized.includes("transaction");
    const hasStableSort = normalized.includes("created_at") || normalized.includes("updated_at") || normalized.includes("id desc");
    const hasFilterGuard = normalized.includes("org_id") || normalized.includes("orgid");

    return {
      boundariesRespected: !normalized.includes("@/modules/") || !normalized.includes("/infrastructure/") || normalized.includes("/application/"),
      noHiddenOrmLeakage: !forbiddenOrmLeak,
      transactionsRespected: hasTransactionBoundary,
      deterministicPagination: hasStableSort,
      stableFiltering: hasFilterGuard,
      notes: [
        hasTransactionBoundary
          ? "Transaction boundary token detected."
          : "No transaction boundary token detected in adapter source.",
        hasStableSort
          ? "Deterministic pagination sort token detected."
          : "Missing deterministic sort token for pagination.",
        hasFilterGuard
          ? "Tenant-scoped filter token detected."
          : "Missing tenant filter token in repository source.",
      ],
    };
  }
}
