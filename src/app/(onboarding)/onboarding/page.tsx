import { redirect } from "next/navigation"
import { Live } from "@/components/live"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"
import { Wordmark } from "@/components/wordmark"
import { prisma } from "@/server/db"
import { requireUser } from "@/server/session"

export const metadata = { title: "Set up your workspace" }

export default function OnboardingPage() {
  return (
    <Live>
      <OnboardingContent />
    </Live>
  )
}

async function OnboardingContent() {
  const user = await requireUser()
  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } })
  if (membership) redirect("/dashboard")
  return (
    <div className="mx-auto grid min-h-screen max-w-xl content-start gap-8 px-4 py-12">
      <Wordmark />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tell Reeno about the business</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This creates the workspace, the free plan, and a strategy outline you can read on the dashboard.
        </p>
      </div>
      <OnboardingForm />
    </div>
  )
}
