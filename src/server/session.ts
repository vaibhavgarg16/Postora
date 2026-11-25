import { connection } from "next/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { parsePlanLimits } from "@/lib/plans"
import { prisma } from "@/server/db"

const WORKSPACE_COOKIE = "reeno_workspace"

export async function requireUser() {
  await connection()
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect("/login")
  return user
}

export async function optionalUser() {
  await connection()
  const session = await auth()
  if (!session?.user?.id) return null
  return prisma.user.findUnique({ where: { id: session.user.id } })
}

export async function requireWorkspace() {
  const user = await requireUser()
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          subscription: { include: { plan: true } },
          profile: true,
          brandVoice: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  })
  if (memberships.length === 0) redirect("/onboarding")

  const cookieStore = await cookies()
  const requested = cookieStore.get(WORKSPACE_COOKIE)?.value
  const membership = memberships.find((item) => item.workspaceId === requested) ?? memberships[0]
  const plan = membership.workspace.subscription?.plan
  const limits = plan ? parsePlanLimits(plan.limits) : null

  return {
    user,
    membership,
    workspace: membership.workspace,
    role: membership.role,
    limits,
    planName: plan?.name ?? "No plan",
    planCode: plan?.code ?? "free",
    memberships,
  }
}

export async function setActiveWorkspace(workspaceId: string) {
  const cookieStore = await cookies()
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  })
}

export function isPlatformAdmin(user: { email: string; platformRole: string }) {
  if (user.platformRole === "PLATFORM_ADMIN") return true
  const allow = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  return allow.includes(user.email.toLowerCase())
}

export async function requirePlatformAdmin() {
  const user = await requireUser()
  if (!isPlatformAdmin(user)) redirect("/dashboard")
  return user
}

export type WorkspaceContext = Awaited<ReturnType<typeof requireWorkspace>>
