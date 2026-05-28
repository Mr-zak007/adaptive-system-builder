import { readFile } from "node:fs/promises";

export interface RlsCoverageResult {
  tenantIsolationPoliciesPresent: boolean;
  crossTenantLeakageGuardsPresent: boolean;
  notes: string[];
}

export interface RlsPolicyValidator {
  validateCoverage(): Promise<RlsCoverageResult>;
}

export class MigrationBackedRlsPolicyValidator implements RlsPolicyValidator {
  constructor(private readonly migrationPath: string) {}

  async validateCoverage(): Promise<RlsCoverageResult> {
    const sql = await readFile(this.migrationPath, "utf-8");
    const requiredPolicies = [
      "create policy tickets_tenant_isolation",
      "create policy ticket_events_tenant_isolation",
      "create policy field_tasks_tenant_isolation",
      "create policy attachments_tenant_isolation",
      "create policy domain_events_tenant_isolation",
      "create policy operation_idempotency_tenant_isolation",
      "create policy audit_logs_tenant_isolation",
    ];

    const missing = requiredPolicies.filter((policy) => !sql.toLowerCase().includes(policy));
    const hasUserBelongsToOrg = sql.toLowerCase().includes("create or replace function public.user_belongs_to_org");

    return {
      tenantIsolationPoliciesPresent: missing.length === 0,
      crossTenantLeakageGuardsPresent: hasUserBelongsToOrg,
      notes:
        missing.length === 0
          ? ["RLS tenant isolation policy coverage is present for vertical-slice core tables."]
          : [`Missing policies: ${missing.join(", ")}`],
    };
  }
}
