import { z } from "zod"

export const planLimitsSchema = z.object({
  workspaces: z.number().int().positive(),
  socialAccounts: z.number().int().nonnegative(),
  aiCaptionsPerMonth: z.number().int().nonnegative(),
  aiGenerationsPerMonth: z.number().int().nonnegative(),
  aiImagesPerMonth: z.number().int().nonnegative(),
  scheduledPostsPerMonth: z.number().int().nonnegative().nullable(),
  fairUseScheduledPosts: z.number().int().positive(),
  teamMembers: z.number().int().positive(),
  autoPublishing: z.boolean(),
  analytics: z.enum(["none", "basic", "advanced"]),
  competitorMonitoring: z.boolean(),
  brandVoice: z.boolean(),
  approvalWorkflows: z.boolean(),
  clientManagement: z.boolean(),
  prioritySupport: z.boolean(),
})

export type PlanLimits = z.infer<typeof planLimitsSchema>

export type UsageMetric =
  | "socialAccounts"
  | "aiCaptions"
  | "aiGenerations"
  | "aiImages"
  | "scheduledPosts"
  | "teamMembers"

export type PlanCatalogItem = {
  code: string
  name: string
  description: string
  monthlyPriceInr: number
  yearlyPriceInr: number
  sortOrder: number
  limits: PlanLimits
  features: string[]
}

const freeLimits: PlanLimits = {
  workspaces: 1,
  socialAccounts: 1,
  aiCaptionsPerMonth: 5,
  aiGenerationsPerMonth: 5,
  aiImagesPerMonth: 0,
  scheduledPostsPerMonth: 5,
  fairUseScheduledPosts: 5,
  teamMembers: 1,
  autoPublishing: false,
  analytics: "none",
  competitorMonitoring: false,
  brandVoice: false,
  approvalWorkflows: false,
  clientManagement: false,
  prioritySupport: false,
}

const starterLimits: PlanLimits = {
  workspaces: 1,
  socialAccounts: 3,
  aiCaptionsPerMonth: 100,
  aiGenerationsPerMonth: 100,
  aiImagesPerMonth: 20,
  scheduledPostsPerMonth: 30,
  fairUseScheduledPosts: 30,
  teamMembers: 1,
  autoPublishing: true,
  analytics: "basic",
  competitorMonitoring: false,
  brandVoice: false,
  approvalWorkflows: false,
  clientManagement: false,
  prioritySupport: false,
}

const growthLimits: PlanLimits = {
  workspaces: 1,
  socialAccounts: 7,
  aiCaptionsPerMonth: 500,
  aiGenerationsPerMonth: 500,
  aiImagesPerMonth: 80,
  scheduledPostsPerMonth: null,
  fairUseScheduledPosts: 2000,
  teamMembers: 1,
  autoPublishing: true,
  analytics: "advanced",
  competitorMonitoring: true,
  brandVoice: true,
  approvalWorkflows: false,
  clientManagement: false,
  prioritySupport: false,
}

const agencyLimits: PlanLimits = {
  workspaces: 5,
  socialAccounts: 20,
  aiCaptionsPerMonth: 1500,
  aiGenerationsPerMonth: 1500,
  aiImagesPerMonth: 200,
  scheduledPostsPerMonth: null,
  fairUseScheduledPosts: 5000,
  teamMembers: 10,
  autoPublishing: true,
  analytics: "advanced",
  competitorMonitoring: true,
  brandVoice: true,
  approvalWorkflows: true,
  clientManagement: true,
  prioritySupport: true,
}

export const PLAN_CATALOG: PlanCatalogItem[] = [
  {
    code: "free",
    name: "Free",
    description: "For trying Reeno with one brand.",
    monthlyPriceInr: 0,
    yearlyPriceInr: 0,
    sortOrder: 0,
    limits: freeLimits,
    features: [
      "1 workspace",
      "1 social account",
      "5 AI captions / month",
      "5 scheduled posts / month",
    ],
  },
  {
    code: "starter",
    name: "Starter",
    description: "For a single business that publishes every week.",
    monthlyPriceInr: 999,
    yearlyPriceInr: 9990,
    sortOrder: 1,
    limits: starterLimits,
    features: [
      "3 connected accounts",
      "100 AI captions / month",
      "20 AI images / month",
      "30 scheduled posts",
      "Auto publishing",
      "Basic analytics",
    ],
  },
  {
    code: "growth",
    name: "Growth",
    description: "For brands that publish across several networks.",
    monthlyPriceInr: 2499,
    yearlyPriceInr: 24990,
    sortOrder: 2,
    limits: growthLimits,
    features: [
      "7 connected accounts",
      "500 AI generations / month",
      "Fair-use scheduling (2,000 / month)",
      "Multi-platform auto publishing",
      "Advanced analytics",
      "Competitor monitoring",
      "Brand voice",
    ],
  },
  {
    code: "agency",
    name: "Agency",
    description: "For teams managing more than one client brand.",
    monthlyPriceInr: 4999,
    yearlyPriceInr: 49990,
    sortOrder: 3,
    limits: agencyLimits,
    features: [
      "5 workspaces",
      "20 connected accounts",
      "1,500 AI generations / month",
      "10 team members",
      "Approval workflows",
      "Client management",
      "Priority support",
    ],
  },
]

export function parsePlanLimits(value: unknown): PlanLimits {
  return planLimitsSchema.parse(value)
}

export function limitFor(limits: PlanLimits, metric: UsageMetric): number {
  switch (metric) {
    case "socialAccounts":
      return limits.socialAccounts
    case "aiCaptions":
      return limits.aiCaptionsPerMonth
    case "aiGenerations":
      return limits.aiGenerationsPerMonth
    case "aiImages":
      return limits.aiImagesPerMonth
    case "scheduledPosts":
      return limits.scheduledPostsPerMonth ?? limits.fairUseScheduledPosts
    case "teamMembers":
      return limits.teamMembers
  }
}

export function canConsume(
  limits: PlanLimits,
  metric: UsageMetric,
  used: number,
  amount = 1,
): { ok: true } | { ok: false; limit: number; used: number } {
  const limit = limitFor(limits, metric)
  if (used + amount <= limit) return { ok: true }
  return { ok: false, limit, used }
}

export function maxOwnedWorkspaces(limits: PlanLimits[]): number {
  if (limits.length === 0) return 1
  return Math.max(...limits.map((item) => item.workspaces))
}

export function inr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

export function monthlyEquivalent(
  plan: { monthlyPriceInr: number; yearlyPriceInr: number },
  interval: "MONTHLY" | "YEARLY",
) {
  if (interval === "YEARLY") return plan.yearlyPriceInr / 12
  return plan.monthlyPriceInr
}
