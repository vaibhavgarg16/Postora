import { createHmac, timingSafeEqual } from "node:crypto"

export function addBillingInterval(start: Date, interval: "MONTHLY" | "YEARLY") {
  const next = new Date(start.getTime())
  if (interval === "YEARLY") next.setUTCFullYear(next.getUTCFullYear() + 1)
  else next.setUTCMonth(next.getUTCMonth() + 1)
  return next
}

export function currentPeriodStart(anchor: Date, now: Date) {
  if (now.getTime() <= anchor.getTime()) return new Date(anchor.getTime())
  let months =
    (now.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
    (now.getUTCMonth() - anchor.getUTCMonth())
  const candidate = new Date(anchor.getTime())
  candidate.setUTCMonth(anchor.getUTCMonth() + months)
  if (candidate.getTime() > now.getTime()) {
    months -= 1
    candidate.setTime(anchor.getTime())
    candidate.setUTCMonth(anchor.getUTCMonth() + months)
  }
  return candidate
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string
  paymentId: string
  signature: string
  secret: string
}) {
  const expected = createHmac("sha256", input.secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex")
  return safeEqualHex(expected, input.signature)
}

export function verifyRazorpayWebhookSignature(input: {
  body: string
  signature: string
  secret: string
}) {
  const expected = createHmac("sha256", input.secret).update(input.body).digest("hex")
  return safeEqualHex(expected, input.signature)
}

function safeEqualHex(expected: string, received: string) {
  const left = Buffer.from(expected)
  const right = Buffer.from(received)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

export function sumMrr(
  subscriptions: Array<{
    status: string
    interval: "MONTHLY" | "YEARLY"
    plan: { monthlyPriceInr: number; yearlyPriceInr: number }
  }>,
) {
  return subscriptions.reduce((total, subscription) => {
    if (subscription.status !== "ACTIVE") return total
    if (subscription.interval === "YEARLY") {
      return total + subscription.plan.yearlyPriceInr / 12
    }
    return total + subscription.plan.monthlyPriceInr
  }, 0)
}
