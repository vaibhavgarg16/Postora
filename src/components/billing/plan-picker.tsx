"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { inr } from "@/lib/plans"

type Plan = {
  code: string
  name: string
  description: string
  monthlyPriceInr: number
  yearlyPriceInr: number
  features: string[]
  current: boolean
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

export function PlanPicker({ plans, canUpgrade }: { plans: Plan[]; canUpgrade: boolean }) {
  const router = useRouter()
  const [interval, setInterval] = useState<"MONTHLY" | "YEARLY">("MONTHLY")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  async function upgrade(planCode: string) {
    setMessage(null)
    setPending(planCode)
    try {
      const checkout = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCode, interval }),
      })
      const payload = (await checkout.json()) as {
        error?: string
        orderId?: string
        amount?: number
        currency?: string
        keyId?: string
        planName?: string
      }
      if (!checkout.ok || !payload.orderId || !payload.keyId) {
        setMessage(payload.error ?? "Checkout could not be started.")
        return
      }
      await loadRazorpay()
      if (!window.Razorpay) {
        setMessage("Razorpay checkout did not load. No charge was confirmed.")
        return
      }
      const checkoutClient = new window.Razorpay({
        key: payload.keyId,
        order_id: payload.orderId,
        amount: payload.amount,
        currency: payload.currency,
        name: "Reeno AI",
        description: `${payload.planName} · ${interval === "YEARLY" ? "Yearly" : "Monthly"}`,
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const confirm = await fetch("/api/billing/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          })
          const confirmed = (await confirm.json()) as { error?: string }
          if (!confirm.ok) {
            setMessage(confirmed.error ?? "Payment was not confirmed. The plan was not changed.")
            return
          }
          router.refresh()
          setMessage("Payment confirmed. The subscription is active.")
        },
      })
      checkoutClient.open()
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex gap-2">
        <Button type="button" variant={interval === "MONTHLY" ? "default" : "outline"} onClick={() => setInterval("MONTHLY")}>
          Monthly
        </Button>
        <Button type="button" variant={interval === "YEARLY" ? "default" : "outline"} onClick={() => setInterval("YEARLY")}>
          Yearly
        </Button>
      </div>
      {message ? <p className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">{message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = interval === "YEARLY" ? plan.yearlyPriceInr : plan.monthlyPriceInr
          return (
            <article key={plan.code} className="flex flex-col rounded-2xl border bg-card p-5">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight">
                {inr(price)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{interval === "YEARLY" ? "year" : "month"}
                </span>
              </p>
              <ul className="mt-4 grid flex-1 gap-2 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {plan.monthlyPriceInr === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {plan.current ? "Current plan" : "Included when a workspace is created."}
                </p>
              ) : (
                <Button
                  type="button"
                  className="mt-4 h-10"
                  disabled={!canUpgrade || pending === plan.code || plan.current}
                  onClick={() => upgrade(plan.code)}
                >
                  {plan.current ? "Current paid plan" : pending === plan.code ? "Starting checkout…" : "Pay with Razorpay"}
                </Button>
              )}
            </article>
          )
        })}
      </div>
      {!canUpgrade ? <p className="text-sm text-muted-foreground">Only an owner or admin can change the plan.</p> : null}
    </div>
  )
}

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Razorpay failed to load"))
    document.body.appendChild(script)
  }).catch(() => undefined)
}
