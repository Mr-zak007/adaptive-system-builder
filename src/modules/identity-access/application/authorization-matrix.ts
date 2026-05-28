export type AppRole =
  | "admin"
  | "dispatcher"
  | "field_technician"
  | "support_engineer"
  | "knowledge_manager"
  | "viewer";

export type ResourceAction =
  | "ticket.assign"
  | "task.complete"
  | "solution.publish"
  | "attachment.register"
  | "error.link"
  | "installation.update";

const permissions: Record<AppRole, Set<ResourceAction>> = {
  admin: new Set([
    "ticket.assign",
    "task.complete",
    "solution.publish",
    "attachment.register",
    "error.link",
    "installation.update",
  ]),
  dispatcher: new Set(["ticket.assign", "attachment.register", "error.link", "installation.update"]),
  field_technician: new Set(["task.complete", "attachment.register", "installation.update"]),
  support_engineer: new Set(["ticket.assign", "solution.publish", "attachment.register", "error.link"]),
  knowledge_manager: new Set(["solution.publish", "attachment.register", "error.link"]),
  viewer: new Set([]),
};

export function canRolePerformAction(role: AppRole, action: ResourceAction) {
  return permissions[role].has(action);
}