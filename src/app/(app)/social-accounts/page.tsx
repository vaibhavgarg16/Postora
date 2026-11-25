import { PLATFORM_LABELS, SOCIAL_PLATFORMS } from "@/lib/constants"
import { Live } from "@/components/live"
import { prisma } from "@/server/db"
import { requireWorkspace } from "@/server/session"

export const metadata = { title: "Social accounts" }

export default function SocialAccountsPage() {
  return (
    <Live>
      <AccountsContent />
    </Live>
  )
}

async function AccountsContent() {
  const context = await requireWorkspace()
  const accounts = await prisma.socialAccount.findMany({ where: { workspaceId: context.workspace.id } })
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Social accounts</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Official OAuth is not configured. Reeno will not pretend an account is connected, and there is no connect
        button until Instagram, Facebook, LinkedIn, X, TikTok, and YouTube credentials are implemented.
      </p>
      <p className="mt-4 text-sm">Connected records in this workspace: {accounts.length}</p>
      <ul className="mt-6 grid gap-3">
        {SOCIAL_PLATFORMS.map((platform) => (
          <li key={platform} className="rounded-2xl border bg-card p-4">
            <p className="font-medium">{PLATFORM_LABELS[platform]}</p>
            <p className="text-sm text-muted-foreground">Not connected</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
