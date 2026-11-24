import { canManageWorkspace } from "@/lib/access"
import { Live } from "@/components/live"
import { PlanPicker } from "@/components/billing/plan-picker"
import { limitFor } from "@/lib/plans"
import { currentPeriodStart } from "@/lib/billing"
import { prisma } from "@/server/db"
import { requireWorkspace } from "@/server/session"

export const metadata = { title: "Billing" }

export default function BillingPage() {
  return (
    <Live>
      <BillingContent />
    </Live>
  )
}

async function BillingContent() {
  const context = await requireWorkspace()
  const [plans, members, accounts] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.workspaceMember.count({ where: { workspaceId: context.workspace.id } }),
    prisma.socialAccount.count({ where: { workspaceId: context.workspace.id } }),
  ])
  const subscription = context.workspace.subscription
  const limits = context.limits
  const usage = limits
    ? [
        ["Social accounts", accounts, limitFor(limits, "socialAccounts")],
        ["Team members", members, limitFor(limits, "teamMembers")],
        ["AI captions this period", 0, limitFor(limits, "aiCaptions")],
        ["Scheduled posts this period", 0, limitFor(limits, "scheduledPosts")],
      ]
    : []
  const period = subscription ? currentPeriodStart(subscription.currentPeriodStart, new Date()) : null

  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Current plan: {context.planName}
          {subscription ? ` · ${subscription.status.toLowerCase()} · ${subscription.interval.toLowerCase()}` : ""}.
          {period ? ` Usage period started ${period.toLocaleDateString("en-IN", { timeZone: context.workspace.timezone })}.` : ""}
        </p>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {usage.map(([label, used, limit]) => (
          <article key={String(label)} className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">
              {used}
              <span className="text-base font-normal text-muted-foreground"> / {limit}</span>
            </p>
          </article>
        ))}
      </section>
      <PlanPicker
        canUpgrade={canManageWorkspace(context.role)}
        plans={plans.map((plan) => ({
          code: plan.code,
          name: plan.name,
          description: plan.description,
          monthlyPriceInr: plan.monthlyPriceInr,
          yearlyPriceInr: plan.yearlyPriceInr,
          features: Array.isArray(plan.features) ? plan.features.filter((item): item is string => typeof item === "string") : [],
          current: plan.id === subscription?.planId,
        }))}
      />
      <p className="text-sm text-muted-foreground">
        Yearly prices are ten times the monthly price. Image allowances on paid plans are stored with the plan and can
        be changed by a platform admin. A plan changes only after Razorpay confirms the payment.
      </p>
    </div>
  )
}
