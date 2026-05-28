import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ArchitecturalFitnessFinding {
  rule: string;
  filePath: string;
  details: string;
}

export interface ArchitecturalFitnessSummary {
  crossModuleImportViolations: ArchitecturalFitnessFinding[];
  repositoryLeakageViolations: ArchitecturalFitnessFinding[];
  dtoViolations: ArchitecturalFitnessFinding[];
  domainBypassViolations: ArchitecturalFitnessFinding[];
  directDbAccessViolations: ArchitecturalFitnessFinding[];
  forbiddenImportViolations: ArchitecturalFitnessFinding[];
  eventContractDriftViolations: ArchitecturalFitnessFinding[];
}

async function listTsFiles(dirPath: string): Promise<string[]> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTsFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalizePath(pathValue: string) {
  return pathValue.replaceAll("\\", "/");
}

function toProjectRelative(absolutePath: string) {
  const normalized = normalizePath(absolutePath);
  const marker = "/dev-server/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex >= 0) {
    return normalized.slice(markerIndex + marker.length);
  }

  return normalized;
}

export async function runArchitecturalFitnessChecks(): Promise<ArchitecturalFitnessSummary> {
  const moduleFiles = await listTsFiles("/dev-server/src/modules");
  const sharedFiles = await listTsFiles("/dev-server/src/shared");
  const files = [...moduleFiles, ...sharedFiles];

  const crossModuleImportViolations: ArchitecturalFitnessFinding[] = [];
  const repositoryLeakageViolations: ArchitecturalFitnessFinding[] = [];
  const dtoViolations: ArchitecturalFitnessFinding[] = [];
  const domainBypassViolations: ArchitecturalFitnessFinding[] = [];
  const directDbAccessViolations: ArchitecturalFitnessFinding[] = [];
  const forbiddenImportViolations: ArchitecturalFitnessFinding[] = [];
  const eventContractDriftViolations: ArchitecturalFitnessFinding[] = [];

  const forbiddenImports = ["react-router-dom", "typeorm", "@prisma/client"];

  for (const absolutePath of files) {
    const relativePath = toProjectRelative(absolutePath);
    const content = await readFile(absolutePath, "utf-8");

    const moduleMatch = relativePath.match(/^src\/modules\/([^/]+)\//);
    const currentModule = moduleMatch?.[1] ?? null;

    for (const line of content.split("\n")) {
      const importMatch = line.match(/from\s+["']([^"']+)["']/);
      if (!importMatch) {
        continue;
      }

      const importPath = importMatch[1];

      const crossImport = importPath.match(/^@\/modules\/([^/]+)\/(application|domain|infrastructure)\//);
      if (crossImport && currentModule && crossImport[1] !== currentModule) {
        crossModuleImportViolations.push({
          rule: "cross-module-imports",
          filePath: relativePath,
          details: `Disallowed import ${importPath}`,
        });
      }

      if (!/\/application\//.test(relativePath) && /repository/i.test(importPath)) {
        repositoryLeakageViolations.push({
          rule: "repository-leakage",
          filePath: relativePath,
          details: `Repository imported outside application layer: ${importPath}`,
        });
      }

      if (!/\/contracts\//.test(relativePath) && /\.contracts(\.ts)?$/.test(importPath) && /transport/i.test(line)) {
        dtoViolations.push({
          rule: "dto-violations",
          filePath: relativePath,
          details: `Transport contract usage outside contracts boundary: ${importPath}`,
        });
      }

      const isServerFunctionWiringFile = /\/contracts\/.+\.functions\.ts$/.test(relativePath);
      if (/^@\/modules\/.+\/infrastructure\//.test(importPath) && !/\/infrastructure\//.test(relativePath) && !isServerFunctionWiringFile) {
        domainBypassViolations.push({
          rule: "domain-bypass",
          filePath: relativePath,
          details: `Infrastructure import from non-infrastructure layer: ${importPath}`,
        });
      }

      if (/^@\/integrations\/supabase\//.test(importPath) && !/\/infrastructure\//.test(relativePath)) {
        directDbAccessViolations.push({
          rule: "direct-db-access",
          filePath: relativePath,
          details: `Direct DB access import outside infrastructure: ${importPath}`,
        });
      }

      if (forbiddenImports.includes(importPath)) {
        forbiddenImportViolations.push({
          rule: "forbidden-imports",
          filePath: relativePath,
          details: `Forbidden runtime import detected: ${importPath}`,
        });
      }
    }
  }

  const eventSourceFile = "/dev-server/src/modules/shared-orchestration/application/vertical-slice-validation.service.ts";
  const eventContractFile = "/dev-server/src/shared/contracts/events/domain-events.ts";
  const [eventSource, eventContracts] = await Promise.all([
    readFile(eventSourceFile, "utf-8"),
    readFile(eventContractFile, "utf-8"),
  ]);

  const emittedEvents = Array.from(eventSource.matchAll(/eventName:\s*"([a-z_]+\.[a-z_]+)"/gi)).map((m) => m[1]);
  const contractEvents = Array.from(eventContracts.matchAll(/eventName:\s*z\.literal\("([a-z_]+\.[a-z_]+)"\)/gi)).map((m) => m[1]);

  const contractSet = new Set(contractEvents);
  for (const emitted of emittedEvents) {
    if (!contractSet.has(emitted)) {
      eventContractDriftViolations.push({
        rule: "event-contract-drift",
        filePath: "src/modules/shared-orchestration/application/vertical-slice-validation.service.ts",
        details: `Emitted event not present in event contract registry: ${emitted}`,
      });
    }
  }

  return {
    crossModuleImportViolations,
    repositoryLeakageViolations,
    dtoViolations,
    domainBypassViolations,
    directDbAccessViolations,
    forbiddenImportViolations,
    eventContractDriftViolations,
  };
}