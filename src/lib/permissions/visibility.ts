import type { Visibility } from "@prisma/client";

export type RoleView = "PI" | "ANALYST" | "COLLABORATOR" | "PUBLIC_VIEWER";

const allowed: Record<RoleView, Visibility[]> = {
  PI: ["PI_ONLY", "ANALYST", "COLLABORATOR", "PUBLIC"],
  ANALYST: ["ANALYST", "COLLABORATOR", "PUBLIC"],
  COLLABORATOR: ["COLLABORATOR", "PUBLIC"],
  PUBLIC_VIEWER: ["PUBLIC"],
};

export function canRoleSeeVisibility(role: RoleView, visibility: Visibility) {
  return allowed[role].includes(visibility);
}

export function visibilityForRole(role: RoleView) {
  return allowed[role];
}

export function assertVisible(role: RoleView, visibility: Visibility) {
  if (!canRoleSeeVisibility(role, visibility)) {
    throw new Error(`Role ${role} cannot access ${visibility} context.`);
  }
}
