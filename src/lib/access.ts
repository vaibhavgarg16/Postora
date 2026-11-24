export type WorkspaceRoleName = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"

const rank: Record<WorkspaceRoleName, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
  OWNER: 3,
}

export function canManageWorkspace(role: WorkspaceRoleName) {
  return role === "OWNER" || role === "ADMIN"
}

export function canInviteRole(actor: WorkspaceRoleName, invite: WorkspaceRoleName) {
  if (!canManageWorkspace(actor)) return false
  if (invite === "OWNER") return false
  return rank[actor] >= rank[invite]
}
