"use server"

import { headers } from "next/headers"
import { hash } from "bcryptjs"
import { AuthError, CredentialsSignin } from "next-auth"
import { z } from "zod"
import { signIn } from "@/auth"
import { emailSchema, passwordSchema } from "@/lib/passwords"
import { safeCallbackPath } from "@/lib/slug"
import { prisma } from "@/server/db"
import { devMailLinkAllowed, sendMail } from "@/server/email"
import { consumeRateLimit } from "@/server/rate-limit"
import { appOrigin } from "@/server/origin"
import { hashToken, newSecretToken } from "@/server/tokens"
import { writeAudit } from "@/server/audit"

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  message?: string
  devLink?: string
}

const registerSchema = z.object({
  name: z.string().trim().min(2, { error: "Enter your name." }).max(80),
  email: emailSchema,
  password: passwordSchema,
})

async function clientIp() {
  const headerStore = await headers()
  return headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

function issues(error: z.ZodError) {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form"
    fieldErrors[key] ??= []
    fieldErrors[key].push(issue.message)
  }
  return fieldErrors
}

async function issueEmailToken(userId: string, purpose: "verify" | "reset") {
  const token = newSecretToken()
  await prisma.emailToken.deleteMany({ where: { userId, purpose, usedAt: null } })
  await prisma.emailToken.create({
    data: {
      userId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + (purpose === "verify" ? 1000 * 60 * 60 * 24 : 1000 * 60 * 30)),
    },
  })
  return token
}

export async function registerAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").toLowerCase().trim(),
    password: formData.get("password"),
  })
  if (!parsed.success) return { fieldErrors: issues(parsed.error) }

  const ip = await clientIp()
  const limit = await consumeRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { error: "Too many signups from this network. Try again later." }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { error: "An account with that email already exists." }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hash(parsed.data.password, 12),
    },
  })
  const token = await issueEmailToken(user.id, "verify")
  const link = `${await appOrigin()}/verify-email?token=${token}`
  const delivery = await sendMail({
    to: user.email,
    subject: "Verify your Reeno AI email",
    text: `Confirm your email for Reeno AI:\n\n${link}\n\nThis link expires in 24 hours.`,
  })
  await writeAudit({ action: "user.registered", actorId: user.id, targetType: "User", targetId: user.id })

  if (!delivery.delivered && !devMailLinkAllowed()) {
    return { error: "Email delivery is not configured. Ask an administrator to set RESEND_API_KEY." }
  }
  return {
    message: delivery.delivered
      ? "Check your inbox for a verification link."
      : "Email delivery is not configured in this environment. Use the development link below.",
    devLink: delivery.delivered ? undefined : link,
  }
}

export async function loginAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim()
  const password = String(formData.get("password") ?? "")
  const callbackUrl = safeCallbackPath(String(formData.get("callbackUrl") ?? ""))
  const ip = await clientIp()
  const limit = await consumeRateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000)
  if (!limit.ok) return { error: "Too many sign-in attempts. Wait a few minutes and try again." }

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl })
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      if (error.code === "email_not_verified") {
        return { error: "Verify your email before signing in. Use the resend form if you need a new link." }
      }
      return { error: "Email or password is incorrect." }
    }
    if (error instanceof AuthError) return { error: "Sign-in failed. Try again." }
    throw error
  }
  return {}
}

export async function resendVerificationAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim()
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { error: "Enter the email you signed up with." }
  const ip = await clientIp()
  const limit = await consumeRateLimit(`verify:${ip}:${email}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { error: "Too many verification emails. Try again later." }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || user.emailVerified) {
    return { message: "If that account still needs verification, a new link is ready." }
  }
  const token = await issueEmailToken(user.id, "verify")
  const link = `${await appOrigin()}/verify-email?token=${token}`
  const delivery = await sendMail({
    to: user.email,
    subject: "Verify your Reeno AI email",
    text: `Confirm your email for Reeno AI:\n\n${link}`,
  })
  return {
    message: delivery.delivered
      ? "If that account still needs verification, a new link is on the way."
      : "Email delivery is not configured. The development link is below.",
    devLink: delivery.delivered || !devMailLinkAllowed() ? undefined : link,
  }
}

export async function verifyEmailAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token") ?? "")
  if (!token) return { error: "That verification link is missing a token." }
  const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!record || record.purpose !== "verify" || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return { error: "This verification link is invalid or expired." }
  }
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ])
  await writeAudit({ action: "user.verified", actorId: record.userId, targetType: "User", targetId: record.userId })
  return { message: "Email verified. You can sign in." }
}

export async function forgotPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim()
  const parsed = emailSchema.safeParse(email)
  if (!parsed.success) return { error: "Enter a valid email address." }
  const ip = await clientIp()
  const limit = await consumeRateLimit(`reset:${ip}:${email}`, 5, 60 * 60 * 1000)
  if (!limit.ok) return { error: "Too many reset requests. Try again later." }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.passwordHash) {
    return { message: "If an account exists for that email, a reset link is ready." }
  }
  const token = await issueEmailToken(user.id, "reset")
  const link = `${await appOrigin()}/reset-password?token=${token}`
  const delivery = await sendMail({
    to: user.email,
    subject: "Reset your Reeno AI password",
    text: `Reset your password:\n\n${link}\n\nThis link expires in 30 minutes.`,
  })
  return {
    message: delivery.delivered
      ? "If an account exists for that email, a reset link is on the way."
      : "Email delivery is not configured. The development link is below.",
    devLink: delivery.delivered || !devMailLinkAllowed() ? undefined : link,
  }
}

const resetSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
})

export async function resetPasswordAction(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { fieldErrors: issues(parsed.error), error: "Choose a stronger password." }
  const record = await prisma.emailToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } })
  if (!record || record.purpose !== "reset" || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return { error: "This reset link is invalid or expired." }
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hash(parsed.data.password, 12) },
    }),
    prisma.emailToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ])
  await writeAudit({ action: "user.password_reset", actorId: record.userId, targetType: "User", targetId: record.userId })
  return { message: "Password updated. You can sign in." }
}

export async function googleSignInAction(formData: FormData) {
  const callbackUrl = safeCallbackPath(String(formData.get("callbackUrl") ?? ""))
  await signIn("google", { redirectTo: callbackUrl })
}

export async function signOutAction() {
  const { signOut } = await import("@/auth")
  await signOut({ redirectTo: "/" })
}
