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
    }
  }

  return {
    crossModuleImportViolations,
    repositoryLeakageViolations,
    dtoViolations,
    domainBypassViolations,
    directDbAccessViolations,
  };
}