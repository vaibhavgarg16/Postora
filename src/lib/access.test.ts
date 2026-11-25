import { describe, expect, it } from "vitest"
import { canInviteRole, canManageWorkspace } from "./access"
import { safeCallbackPath, slugify } from "./slug"

describe("workspace access", () => {
  it("lets owners invite admins and stops viewers from inviting anyone", () => {
    expect(canManageWorkspace("OWNER")).toBe(true)
    expect(canInviteRole("OWNER", "ADMIN")).toBe(true)
    expect(canInviteRole("ADMIN", "OWNER")).toBe(false)
    expect(canInviteRole("VIEWER", "EDITOR")).toBe(false)
  })

  it("keeps slugs and callback paths inside the app", () => {
    expect(slugify("Mina's Kitchen!")).toBe("mina-s-kitchen")
    expect(safeCallbackPath("https://evil.example")).toBe("/dashboard")
    expect(safeCallbackPath("//evil.example")).toBe("/dashboard")
    expect(safeCallbackPath("/billing")).toBe("/billing")
  })
})
