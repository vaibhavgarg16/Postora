"use server"

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { SocialPlatform } from "@prisma/client"
import { canInviteRole, canManageWorkspace } from "@/lib/access"
import { PLATFORM_LABELS, TIMEZONES } from "@/lib/constants"
import { onboardingSchema, profileSchema } from "@/lib/forms"
import { canConsume, maxOwnedWorkspaces, parsePlanLimits } from "@/lib/plans"
import { slugify } from "@/lib/slug"
import { buildStarterStrategy } from "@/lib/strategy"
import { prisma } from "@/server/db"
import { devMailLinkAllowed, sendMail } from "@/server/email"
import { requireUser, requireWorkspace, setActiveWorkspace } from "@/server/session"
import { appOrigin } from "@/server/origin"
import { hashToken, newSecretToken } from "@/server/tokens"
import { writeAudit } from "@/server/audit"

export type ActionState = {
  error?: string
  message?: string
  devLink?: string
}

async function maybeAiStrategy(input: Parameters<typeof buildStarterStrategy>[0]) {
  const starter = buildStarterStrategy(input)
  const key = process.env.OPENAI_API_KEY
  if (!key) return starter
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content:
              "You write a practical weekly social media strategy for a small business. Do not invent metrics, follower counts, or competitor data. Keep it under 250 words.",
          },
          { role: "user", content: JSON.stringify(input) },
        ],
      }),
    })
    if (!response.ok) return starter
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const text = payload.choices?.[0]?.message?.content?.trim()
    if (!text) return starter
    return { outline: text, source: "OPENAI" as const }
  } catch (error) {
    console.error("[reeno] strategy generation failed", error)
    return starter
  }
}

async function saveLogo(workspaceId: string, file: FormDataEntryValue | null) {
  if (!(file instanceof File) || file.size === 0) return null
  if (file.size > 2 * 1024 * 1024) throw new Error("Logo must be 2 MB or smaller.")
  const allowed = new Map([
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
  ])
  const extension = allowed.get(file.type)
  if (!extension) throw new Error("Logo must be a PNG, JPG, or WebP file.")
  const directory = path.join(process.cwd(), "storage", "logos", workspaceId)
  await mkdir(directory, { recursive: true })
  const filename = `logo.${extension}`
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()))
  return path.join("logos", workspaceId, filename)
}

export async function completeOnboardingAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  const owned = await prisma.workspaceMember.findMany({
    where: { userId: user.id, role: "OWNER" },
    include: { workspace: { include: { subscription: { include: { plan: true } } } } },
  })
  const ownedLimits = owned.flatMap((member) =>
    member.workspace.subscription ? [parsePlanLimits(member.workspace.subscription.plan.limits)] : [],
  )
  if (owned.length >= maxOwnedWorkspaces(ownedLimits)) {
    return { error: "Your current plan does not allow another workspace." }
  }

  const platforms = formData.getAll("platforms").map(String)
  const parsed = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    category: formData.get("category"),
    website: String(formData.get("website") ?? ""),
    description: formData.get("description"),
    targetAudience: formData.get("targetAudience"),
    brandTone: formData.get("brandTone"),
    platforms,
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
    timezone: formData.get("timezone"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the business profile and try again." }

  let website: string | null = parsed.data.website?.trim() || null
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`

  const strategy = await maybeAiStrategy({
    businessName: parsed.data.businessName,
    category: parsed.data.category,
    description: parsed.data.description,
    targetAudience: parsed.data.targetAudience,
    brandTone: parsed.data.brandTone,
    platforms: parsed.data.platforms.map((platform) => PLATFORM_LABELS[platform]),
  })

  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { code: "free" } })
  if (!freePlan) return { error: "Plans are not seeded yet. Run npm run db:seed." }

  const base = slugify(parsed.data.businessName)
  let slug = base
  for (let attempt = 2; await prisma.workspace.findUnique({ where: { slug } }); attempt += 1) {
    slug = `${base}-${attempt}`
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.businessName,
      slug,
      timezone: parsed.data.timezone,
      members: { create: { userId: user.id, role: "OWNER" } },
      profile: {
        create: {
          businessName: parsed.data.businessName,
          category: parsed.data.category,
          website,
          description: parsed.data.description,
          targetAudience: parsed.data.targetAudience,
          brandTone: parsed.data.brandTone,
          platforms: parsed.data.platforms as SocialPlatform[],
          brandColors: [parsed.data.primaryColor, parsed.data.secondaryColor],
          strategyOutline: strategy.outline,
          strategySource: strategy.source,
        },
      },
      brandVoice: { create: { tone: parsed.data.brandTone, customInstructions: "" } },
      subscription: {
        create: {
          planId: freePlan.id,
          status: "ACTIVE",
          interval: "MONTHLY",
          currentPeriodStart: new Date(),
        },
      },
    },
  })

  try {
    const logoPath = await saveLogo(workspace.id, formData.get("logo"))
    if (logoPath) {
      await prisma.businessProfile.update({ where: { workspaceId: workspace.id }, data: { logoPath } })
    }
  } catch (error) {
    await prisma.workspace.delete({ where: { id: workspace.id } })
    return { error: error instanceof Error ? error.message : "Could not save the logo." }
  }

  await setActiveWorkspace(workspace.id)
  await writeAudit({
    action: "workspace.created",
    actorId: user.id,
    workspaceId: workspace.id,
    targetType: "Workspace",
    targetId: workspace.id,
    metadata: { strategySource: strategy.source },
  })
  await prisma.notification.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      title: "Workspace ready",
      body:
        strategy.source === "OPENAI"
          ? "Your profile and an AI strategy outline are saved."
          : "Your profile is saved with a starter outline. Add OPENAI_API_KEY to generate an AI strategy.",
      href: "/dashboard",
    },
  })
  redirect("/dashboard")
}

export async function updateBusinessProfileAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireWorkspace()
  if (!canManageWorkspace(context.role)) return { error: "You do not have permission to edit this workspace." }
  const platforms = formData.getAll("platforms").map(String)
  const parsed = profileSchema.safeParse({
    businessName: formData.get("businessName"),
    category: formData.get("category"),
    website: String(formData.get("website") ?? ""),
    description: formData.get("description"),
    targetAudience: formData.get("targetAudience"),
    brandTone: formData.get("brandTone"),
    platforms,
    primaryColor: formData.get("primaryColor"),
    secondaryColor: formData.get("secondaryColor"),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." }

  let website: string | null = parsed.data.website?.trim() || null
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`
  let logoPath: string | undefined
  try {
    const saved = await saveLogo(context.workspace.id, formData.get("logo"))
    if (saved) logoPath = saved
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the logo." }
  }

  await prisma.businessProfile.update({
    where: { workspaceId: context.workspace.id },
    data: {
      businessName: parsed.data.businessName,
      category: parsed.data.category,
      website,
      description: parsed.data.description,
      targetAudience: parsed.data.targetAudience,
      brandTone: parsed.data.brandTone,
      platforms: parsed.data.platforms as SocialPlatform[],
      brandColors: [parsed.data.primaryColor, parsed.data.secondaryColor],
      logoPath,
    },
  })
  await prisma.workspace.update({
    where: { id: context.workspace.id },
    data: { name: parsed.data.businessName },
  })
  await prisma.brandVoice.update({
    where: { workspaceId: context.workspace.id },
    data: { tone: parsed.data.brandTone },
  })
  await writeAudit({
    action: "profile.updated",
    actorId: context.user.id,
    workspaceId: context.workspace.id,
    targetType: "BusinessProfile",
    targetId: context.workspace.id,
  })
  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return { message: "Business profile saved." }
}

export async function updateWorkspaceSettingsAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireWorkspace()
  if (!canManageWorkspace(context.role)) return { error: "You do not have permission to edit this workspace." }
  const timezone = String(formData.get("timezone") ?? "")
  if (!TIMEZONES.includes(timezone as (typeof TIMEZONES)[number])) return { error: "Choose a supported timezone." }
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2) return { error: "Workspace name is too short." }
  await prisma.workspace.update({ where: { id: context.workspace.id }, data: { name, timezone } })
  revalidatePath("/settings")
  return { message: "Workspace settings saved." }
}

export async function updateBrandVoiceAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireWorkspace()
  if (!canManageWorkspace(context.role)) return { error: "You do not have permission to edit brand voice." }
  if (!context.limits?.brandVoice) {
    return { error: "Custom brand instructions are included on the Growth and Agency plans." }
  }
  const instructions = String(formData.get("customInstructions") ?? "").trim().slice(0, 1000)
  await prisma.brandVoice.update({
    where: { workspaceId: context.workspace.id },
    data: { customInstructions: instructions },
  })
  await writeAudit({
    action: "brand_voice.updated",
    actorId: context.user.id,
    workspaceId: context.workspace.id,
    targetType: "BrandVoice",
    targetId: context.workspace.id,
  })
  revalidatePath("/settings")
  return { message: "Brand instructions saved." }
}

export async function updateAccountNameAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser()
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2) return { error: "Enter your name." }
  await prisma.user.update({ where: { id: user.id }, data: { name } })
  return { message: "Account name saved." }
}

export async function switchWorkspaceAction(formData: FormData) {
  const context = await requireWorkspace()
  const workspaceId = String(formData.get("workspaceId") ?? "")
  const allowed = context.memberships.some((member) => member.workspaceId === workspaceId)
  if (!allowed) return
  await setActiveWorkspace(workspaceId)
  redirect("/dashboard")
}

export async function inviteMemberAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const context = await requireWorkspace()
  const role = String(formData.get("role") ?? "")
  if (role !== "ADMIN" && role !== "EDITOR" && role !== "VIEWER") return { error: "Choose a role." }
  if (!canInviteRole(context.role, role)) return { error: "You cannot assign that role." }
  const email = String(formData.get("email") ?? "").toLowerCase().trim()
  if (!z.email().safeParse(email).success) return { error: "Enter a valid email address." }
  if (!context.limits) return { error: "This workspace has no plan." }

  const [members, pending] = await Promise.all([
    prisma.workspaceMember.count({ where: { workspaceId: context.workspace.id } }),
    prisma.workspaceInvite.count({
      where: { workspaceId: context.workspace.id, acceptedAt: null, expiresAt: { gt: new Date() } },
    }),
  ])
  const room = canConsume(context.limits, "teamMembers", members + pending, 1)
  if (!room.ok) {
    return {
      error: `The ${context.planName} plan includes ${room.limit} team member${room.limit === 1 ? "" : "s"}. Upgrade to invite more people.`,
    }
  }

  const already = await prisma.workspaceMember.findFirst({
    where: { workspaceId: context.workspace.id, user: { email } },
  })
  if (already) return { error: "That person is already in this workspace." }

  const token = newSecretToken()
  await prisma.workspaceInvite.deleteMany({
    where: { workspaceId: context.workspace.id, email, acceptedAt: null },
  })
  await prisma.workspaceInvite.create({
    data: {
      workspaceId: context.workspace.id,
      email,
      role,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      invitedById: context.user.id,
    },
  })
  const link = `${await appOrigin()}/invite/${token}`
  const delivery = await sendMail({
    to: email,
    subject: `Join ${context.workspace.name} on Reeno AI`,
    text: `${context.user.name ?? "A teammate"} invited you to ${context.workspace.name} as ${role.toLowerCase()}.\n\n${link}`,
  })
  await writeAudit({
    action: "member.invited",
    actorId: context.user.id,
    workspaceId: context.workspace.id,
    targetType: "WorkspaceInvite",
    metadata: { email, role },
  })
  revalidatePath("/team")
  return {
    message: delivery.delivered ? `Invite sent to ${email}.` : "Email delivery is not configured. Share the development link.",
    devLink: delivery.delivered || !devMailLinkAllowed() ? undefined : link,
  }
}

export async function acceptInviteFormAction(_state: ActionState, formData: FormData) {
  return acceptInviteAction(String(formData.get("token") ?? ""))
}

export async function acceptInviteAction(token: string): Promise<ActionState> {
  const user = await requireUser()
  const invite = await prisma.workspaceInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { workspace: { include: { subscription: { include: { plan: true } } } } },
  })
  if (!invite || invite.acceptedAt || invite.expiresAt.getTime() < Date.now()) {
    return { error: "This invite is invalid or expired." }
  }
  if (invite.email !== user.email.toLowerCase()) {
    return { error: `This invite was sent to ${invite.email}. Sign in with that email.` }
  }
  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
  })
  if (!existing) {
    const limits = invite.workspace.subscription
      ? parsePlanLimits(invite.workspace.subscription.plan.limits)
      : null
    const members = await prisma.workspaceMember.count({ where: { workspaceId: invite.workspaceId } })
    if (!limits || !canConsume(limits, "teamMembers", members, 1).ok) {
      return { error: "This workspace has reached its team member limit." }
    }
    await prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
    })
  }
  await prisma.workspaceInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } })
  await setActiveWorkspace(invite.workspaceId)
  await writeAudit({
    action: "member.joined",
    actorId: user.id,
    workspaceId: invite.workspaceId,
    targetType: "WorkspaceMember",
    targetId: user.id,
  })
  redirect("/dashboard")
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser()
  const id = String(formData.get("id") ?? "")
  await prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  })
  revalidatePath("/dashboard")
}
