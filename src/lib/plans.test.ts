import { describe, expect, it } from "vitest"
import { PLAN_CATALOG, canConsume, maxOwnedWorkspaces, parsePlanLimits } from "./plans"

describe("plan limits", () => {
  it("parses every seeded plan", () => {
    for (const plan of PLAN_CATALOG) {
      expect(parsePlanLimits(plan.limits).workspaces).toBeGreaterThan(0)
    }
  })

  it("blocks the sixth free caption", () => {
    const free = PLAN_CATALOG.find((plan) => plan.code === "free")!
    expect(canConsume(free.limits, "aiCaptions", 5)).toEqual({ ok: false, limit: 5, used: 5 })
    expect(canConsume(free.limits, "aiCaptions", 4).ok).toBe(true)
  })

  it("uses the fair-use cap when monthly scheduling is unlimited", () => {
    const growth = PLAN_CATALOG.find((plan) => plan.code === "growth")!
    expect(growth.limits.scheduledPostsPerMonth).toBeNull()
    expect(canConsume(growth.limits, "scheduledPosts", 1999).ok).toBe(true)
    expect(canConsume(growth.limits, "scheduledPosts", 2000).ok).toBe(false)
  })

  it("lets an agency owner open more workspaces than a free owner", () => {
    const free = PLAN_CATALOG.find((plan) => plan.code === "free")!
    const agency = PLAN_CATALOG.find((plan) => plan.code === "agency")!
    expect(maxOwnedWorkspaces([])).toBe(1)
    expect(maxOwnedWorkspaces([free.limits])).toBe(1)
    expect(maxOwnedWorkspaces([agency.limits])).toBe(5)
  })
})
