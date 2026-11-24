import Link from "next/link"
import { Live } from "@/components/live"
import { inr, monthlyEquivalent } from "@/lib/plans"
import { sumMrr } from "@/lib/billing"
import { updatePlanAction } from "@/server/actions/admin"
import { parsePlanLimits } from "@/lib/plans"
import { prisma } from "@/server/db"
import { requirePlatformAdmin } from "@/server/session"

export const metadata = { title: "Admin" }

export default function AdminPage() {
  return (
    <Live>
      <AdminContent />
    </Live>
  )
}

async function AdminContent() {
  await requirePlatformAdmin()
  const [users, subscriptions, plans, failedJobs, publishFailures] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.findMany({ where: { status: "ACTIVE" }, include: { plan: true } }),
    prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.scheduledJob.count({ where: { status: "failed" } }),
    prisma.publishingLog.count({ where: { success: false } }),
  ])
  const paid = subscriptions.filter((item) => item.plan.monthlyPriceInr > 0)
  const mrr = sumMrr(
    paid.map((item) => ({
      status: item.status,
      interval: item.interval,
      plan: item.plan,
    })),
  )

  return (
    <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <Link className="text-sm underline" href="/dashboard">
          Back to workspace
        </Link>
      </div>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Registered users", String(users)],
          ["Active subscriptions", String(subscriptions.length)],
          ["Monthly recurring revenue", inr(mrr)],
          ["Failed publishing jobs", String(failedJobs + publishFailures)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </article>
        ))}
      </section>
      <p className="text-sm text-muted-foreground">
        Revenue counts only active paid subscriptions. Yearly plans contribute one twelfth of the yearly price. Failed
        jobs are rows in the database, currently {failedJobs} scheduled jobs and {publishFailures} publishing logs.
      </p>
      <section className="grid gap-4">
        {plans.map((plan) => {
          const limits = parsePlanLimits(plan.limits)
          return (
            <form key={plan.id} action={updatePlanAction} className="grid gap-3 rounded-2xl border bg-card p-5">
              <input type="hidden" name="code" value={plan.code} />
              <h2 className="font-semibold">
                {plan.name} · {inr(monthlyEquivalent(plan, "MONTHLY"))}/mo equivalent on monthly billing
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-sm">
                  Monthly INR
                  <input name="monthlyPriceInr" defaultValue={plan.monthlyPriceInr} className="mt-1 h-10 w-full rounded-lg border bg-background px-3" />
                </label>
                <label className="text-sm">
                  Yearly INR
                  <input name="yearlyPriceInr" defaultValue={plan.yearlyPriceInr} className="mt-1 h-10 w-full rounded-lg border bg-background px-3" />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={plan.active} /> Active
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["workspaces", limits.workspaces],
                    ["socialAccounts", limits.socialAccounts],
                    ["aiCaptionsPerMonth", limits.aiCaptionsPerMonth],
                    ["aiGenerationsPerMonth", limits.aiGenerationsPerMonth],
                    ["aiImagesPerMonth", limits.aiImagesPerMonth],
                    ["fairUseScheduledPosts", limits.fairUseScheduledPosts],
                    ["teamMembers", limits.teamMembers],
                  ] as const
                ).map(([name, value]) => (
                  <label key={name} className="text-sm">
                    {name}
                    <input name={name} defaultValue={value} className="mt-1 h-10 w-full rounded-lg border bg-background px-3" />
                  </label>
                ))}
                <label className="text-sm">
                  scheduledPostsPerMonth
                  <input
                    name="scheduledPostsPerMonth"
                    defaultValue={limits.scheduledPostsPerMonth ?? ""}
                    placeholder="empty = fair use"
                    className="mt-1 h-10 w-full rounded-lg border bg-background px-3"
                  />
                </label>
                <label className="text-sm">
                  analytics
                  <select name="analytics" defaultValue={limits.analytics} className="mt-1 h-10 w-full rounded-lg border bg-background px-3">
                    <option value="none">none</option>
                    <option value="basic">basic</option>
                    <option value="advanced">advanced</option>
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {(
                  [
                    ["autoPublishing", limits.autoPublishing],
                    ["competitorMonitoring", limits.competitorMonitoring],
                    ["brandVoice", limits.brandVoice],
                    ["approvalWorkflows", limits.approvalWorkflows],
                    ["clientManagement", limits.clientManagement],
                    ["prioritySupport", limits.prioritySupport],
                  ] as const
                ).map(([name, checked]) => (
                  <label key={name} className="flex items-center gap-2">
                    <input type="checkbox" name={name} defaultChecked={checked} /> {name}
                  </label>
                ))}
              </div>
              <button className="h-10 w-fit rounded-lg bg-primary px-4 text-sm text-primary-foreground" type="submit">
                Save plan
              </button>
            </form>
          )
        })}
      </section>
      <UserTable />
    </div>
  )
}

async function UserTable() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { memberships: true },
  })
  return (
    <section>
      <h2 className="font-semibold">Recent users</h2>
      <ul className="mt-3 grid gap-2 text-sm">
        {users.map((user) => (
          <li key={user.id} className="flex justify-between rounded-xl border px-3 py-2">
            <span>{user.email}</span>
            <span className="text-muted-foreground">
              {user.platformRole.toLowerCase()} · {user.memberships.length} workspace{user.memberships.length === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
