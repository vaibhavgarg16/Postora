import { describe, expect, it } from "vitest"
import { createHmac } from "node:crypto"
import {
  addBillingInterval,
  currentPeriodStart,
  sumMrr,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "./billing"

describe("billing", () => {
  it("moves a mid-month date forward by one month or year", () => {
    const start = new Date("2026-03-15T00:00:00.000Z")
    expect(addBillingInterval(start, "MONTHLY").toISOString()).toBe("2026-04-15T00:00:00.000Z")
    expect(addBillingInterval(start, "YEARLY").toISOString()).toBe("2027-03-15T00:00:00.000Z")
  })

  it("finds the current monthly period from an anchor", () => {
    const anchor = new Date("2026-01-15T00:00:00.000Z")
    const now = new Date("2026-03-20T00:00:00.000Z")
    expect(currentPeriodStart(anchor, now).toISOString()).toBe("2026-03-15T00:00:00.000Z")
  })

  it("counts only active paid subscriptions toward MRR", () => {
    const total = sumMrr([
      { status: "ACTIVE", interval: "MONTHLY", plan: { monthlyPriceInr: 999, yearlyPriceInr: 9990 } },
      { status: "ACTIVE", interval: "YEARLY", plan: { monthlyPriceInr: 2499, yearlyPriceInr: 24990 } },
      { status: "CANCELED", interval: "MONTHLY", plan: { monthlyPriceInr: 4999, yearlyPriceInr: 49990 } },
    ])
    expect(total).toBe(999 + 24990 / 12)
  })

  it("accepts a matching Razorpay signature and rejects a tampered one", () => {
    const secret = "test-secret"
    const signature = createHmac("sha256", secret).update("order_1|pay_1").digest("hex")
    expect(
      verifyRazorpayPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature, secret }),
    ).toBe(true)
    expect(
      verifyRazorpayPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature: "nope", secret }),
    ).toBe(false)
    const webhook = createHmac("sha256", secret).update("{\"ok\":true}").digest("hex")
    expect(verifyRazorpayWebhookSignature({ body: "{\"ok\":true}", signature: webhook, secret })).toBe(true)
  })
})
