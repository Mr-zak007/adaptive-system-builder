export function assertErrorCodeFormat(code: string) {
  if (!/^[A-Z0-9-]{3,30}$/.test(code.trim())) {
    throw new Error("INVALID_ERROR_CODE_FORMAT");
  }
}

export function assertErrorSeverity(value: string) {
  if (!["low", "medium", "high", "critical"].includes(value)) {
    throw new Error("INVALID_ERROR_SEVERITY");
  }
}