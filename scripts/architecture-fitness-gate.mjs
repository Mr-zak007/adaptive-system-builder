import { runArchitecturalFitnessChecks } from "../src/modules/shared-orchestration/infrastructure/architectural-fitness-checks.server";

const summary = await runArchitecturalFitnessChecks();

const failingBuckets = [
  ["crossModuleImportViolations", summary.crossModuleImportViolations],
  ["repositoryLeakageViolations", summary.repositoryLeakageViolations],
  ["dtoViolations", summary.dtoViolations],
  ["domainBypassViolations", summary.domainBypassViolations],
  ["directDbAccessViolations", summary.directDbAccessViolations],
  ["forbiddenImportViolations", summary.forbiddenImportViolations],
  ["eventContractDriftViolations", summary.eventContractDriftViolations],
].filter(([, findings]) => findings.length > 0);

if (failingBuckets.length === 0) {
  console.log("Architecture fitness gate passed.");
  process.exit(0);
}

console.error("Architecture fitness gate failed:");
for (const [bucket, findings] of failingBuckets) {
  console.error(`- ${bucket}: ${findings.length}`);
  for (const finding of findings.slice(0, 10)) {
    console.error(`  • ${finding.filePath} :: ${finding.details}`);
  }
}

process.exit(1);
