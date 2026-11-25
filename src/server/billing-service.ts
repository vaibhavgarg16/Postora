import Razorpay from "razorpay"
import { addBillingInterval, verifyRazorpayPaymentSignature } from "@/lib/billing"
import { prisma } from "@/server/db"
import { writeAudit } from "@/server/audit"

export function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

export async function createCheckoutOrder(input: {
  workspaceId: string
  planCode: string
  interval: "MONTHLY" | "YEARLY"
}) {
  if (!razorpayConfigured()) {
    return { error: "Razorpay is not configured. No charge was created." as const }
  }
  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: input.planCode } })
  if (!plan || !plan.active || plan.monthlyPriceInr <= 0) {
    return { error: "That plan cannot be purchased." as const }
  }
  const amountInr = input.interval === "YEARLY" ? plan.yearlyPriceInr : plan.monthlyPriceInr
  const amountPaise = amountInr * 100
  const attempt = await prisma.paymentAttempt.create({
    data: {
      workspaceId: input.workspaceId,
      planId: plan.id,
      interval: input.interval,
      razorpayOrderId: `pending_${crypto.randomUUID()}`,
      amountPaise,
      status: "created",
    },
  })
  const client = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
  const order = await client.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: attempt.id.slice(0, 40),
    notes: {
      workspaceId: input.workspaceId,
      planCode: plan.code,
      interval: input.interval,
      attemptId: attempt.id,
    },
  })
  await prisma.paymentAttempt.update({
    where: { id: attempt.id },
    data: { razorpayOrderId: order.id },
  })
  return {
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID!,
    planName: plan.name,
  }
}

export async function activatePayment(input: {
  orderId: string
  paymentId: string
  signature?: string
  webhook?: boolean
}) {
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { razorpayOrderId: input.orderId },
    include: { plan: true },
  })
  if (!attempt) return { error: "Unknown order." as const }
  if (attempt.status === "paid" && attempt.razorpayPaymentId === input.paymentId) {
    return { ok: true as const, alreadyApplied: true }
  }
  if (!input.webhook) {
    if (!input.signature || !process.env.RAZORPAY_KEY_SECRET) return { error: "Missing payment signature." as const }
    const valid = verifyRazorpayPaymentSignature({
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: input.signature,
      secret: process.env.RAZORPAY_KEY_SECRET,
    })
    if (!valid) return { error: "Payment signature did not match." as const }
  }

  const periodStart = new Date()
  const periodEnd = addBillingInterval(periodStart, attempt.interval)
  await prisma.$transaction(async (tx) => {
    const current = await tx.paymentAttempt.findUnique({ where: { id: attempt.id } })
    if (current?.status === "paid") return
    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: "paid", razorpayPaymentId: input.paymentId },
    })
    await tx.subscription.update({
      where: { workspaceId: attempt.workspaceId },
      data: {
        planId: attempt.planId,
        status: "ACTIVE",
        interval: attempt.interval,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      },
    })
  })
  await writeAudit({
    action: "subscription.activated",
    workspaceId: attempt.workspaceId,
    targetType: "Subscription",
    targetId: attempt.workspaceId,
    metadata: { plan: attempt.plan.code, interval: attempt.interval, paymentId: input.paymentId },
  })
  const owner = await prisma.workspaceMember.findFirst({
    where: { workspaceId: attempt.workspaceId, role: "OWNER" },
  })
  if (owner) {
    await prisma.notification.create({
      data: {
        userId: owner.userId,
        workspaceId: attempt.workspaceId,
        title: "Subscription active",
        body: `${attempt.plan.name} is active after Razorpay confirmed payment ${input.paymentId}.`,
        href: "/billing",
      },
    })
  }
  return { ok: true as const }
}
