import Link from "next/link"
import { Suspense } from "react"
import { buttonVariants } from "@/components/ui/button"
import { Wordmark } from "@/components/wordmark"
import { ThemeToggle } from "@/components/theme-toggle"
import { inr } from "@/lib/plans"
import { prisma } from "@/server/db"
import { cn } from "cn"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Wordmark />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3")}>
            Sign in
          </Link>
          <Link href="/register" className={cn(buttonVariants(), "h-9 px-3")}>
            Start free
          </Link>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-16 px-4 pb-20">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-medium text-primary">Social operations for small teams</p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              One desk for the accounts a business actually uses.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Reeno AI keeps the workspace, the plan limits, and the brand profile in one place. Publishing to
              Instagram, Facebook, LinkedIn, X, TikTok, and YouTube is not connected yet, and the product does not
              pretend that it is.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/register" className={cn(buttonVariants(), "h-10 px-4")}>
                Create a workspace
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>
                I already have an account
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border bg-card p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Interface preview</p>
            <div className="mt-4 grid gap-3">
              {["Write in the brand tone", "See what is actually scheduled", "Stop when the plan limit is reached"].map(
                (item) => (
                  <div key={item} className="rounded-2xl bg-muted px-4 py-3 text-sm">
                    {item}
                  </div>
                ),
              )}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">This panel is a layout sketch, not live account data.</p>
          </div>
        </section>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted" />}>
          <Pricing />
        </Suspense>
      </main>
    </div>
  )
}

async function Pricing() {
  const plans = await prisma.subscriptionPlan.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })
  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Prices and limits are the live plan records. Publishing, analytics, and competitor monitoring are included on
        paid plans, and those integrations are not connected in this release.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">{plan.name}</h3>
            <p className="mt-3 text-3xl font-semibold">{inr(plan.monthlyPriceInr)}</p>
            <p className="text-xs text-muted-foreground">per month · {inr(plan.yearlyPriceInr)} yearly</p>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
              {Array.isArray(plan.features)
                ? plan.features.filter((item): item is string => typeof item === "string").map((feature) => <li key={feature}>{feature}</li>)
                : null}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
