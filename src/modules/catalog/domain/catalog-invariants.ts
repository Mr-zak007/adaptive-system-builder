export function assertBrandName(name: string) {
  if (!name.trim() || name.trim().length < 2) {
    throw new Error("INVALID_BRAND_NAME");
  }
}

export function assertModelSpecs(specifications: Record<string, string>) {
  if (Object.keys(specifications).length === 0) {
    throw new Error("INVALID_MODEL_SPECIFICATIONS");
  }
}