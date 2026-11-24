"use server"

import { revalidatePath } from "next/cache"
import { planLimitsSchema } from "@/lib/plans"
import { prisma } from "@/server/db"
import { requirePlatformAdmin } from "@/server/session"
import { writeAudit } from "@/server/audit"

export async function updatePlanAction(formData: FormData) {
  const admin = await requirePlatformAdmin()
  const code = String(formData.get("code") ?? "")
  const monthlyPriceInr = Number(formData.get("monthlyPriceInr"))
  const yearlyPriceInr = Number(formData.get("yearlyPriceInr"))
  const active = formData.get("active") === "on"
  const scheduledRaw = String(formData.get("scheduledPostsPerMonth") ?? "")
  const candidate = {
    workspaces: Number(formData.get("workspaces")),
    socialAccounts: Number(formData.get("socialAccounts")),
    aiCaptionsPerMonth: Number(formData.get("aiCaptionsPerMonth")),
    aiGenerationsPerMonth: Number(formData.get("aiGenerationsPerMonth")),
    aiImagesPerMonth: Number(formData.get("aiImagesPerMonth")),
    scheduledPostsPerMonth: scheduledRaw === "" ? null : Number(scheduledRaw),
    fairUseScheduledPosts: Number(formData.get("fairUseScheduledPosts")),
    teamMembers: Number(formData.get("teamMembers")),
    autoPublishing: formData.get("autoPublishing") === "on",
    analytics: String(formData.get("analytics") ?? "none"),
    competitorMonitoring: formData.get("competitorMonitoring") === "on",
    brandVoice: formData.get("brandVoice") === "on",
    approvalWorkflows: formData.get("approvalWorkflows") === "on",
    clientManagement: formData.get("clientManagement") === "on",
    prioritySupport: formData.get("prioritySupport") === "on",
  }
  const limits = planLimitsSchema.safeParse(candidate)
  if (!limits.success || !Number.isFinite(monthlyPriceInr) || !Number.isFinite(yearlyPriceInr)) {
    return
  }
  await prisma.subscriptionPlan.update({
    where: { code },
    data: { monthlyPriceInr, yearlyPriceInr, active, limits: limits.data },
  })
  await writeAudit({
    action: "plan.updated",
    actorId: admin.id,
    targetType: "SubscriptionPlan",
    targetId: code,
  })
  revalidatePath("/admin")
  revalidatePath("/billing")
}
