export function assertClientIdentity(name: string, email: string) {
  if (!name.trim() || !email.includes("@")) {
    throw new Error("INVALID_CLIENT_PROFILE");
  }
}

export function assertSolarComponentType(componentType: string) {
  if (!componentType.trim()) {
    throw new Error("INVALID_COMPONENT_TYPE");
  }
}