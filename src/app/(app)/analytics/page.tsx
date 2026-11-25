import { Live } from "@/components/live"
import { prisma } from "@/server/db"
import { requireWorkspace } from "@/server/session"

export const metadata = { title: "Analytics" }

export default function AnalyticsPage() {
  return (
    <Live>
      <AnalyticsContent />
    </Live>
  )
}

async function AnalyticsContent() {
  const context = await requireWorkspace()
  const rows = await prisma.analytics.count({ where: { workspaceId: context.workspace.id } })
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Likes, comments, shares, impressions, reach, and follower growth stay blank until a platform API returns them.
        This page does not chart sample numbers.
      </p>
      <p className="mt-4 text-sm">Stored metric rows: {rows}</p>
    </div>
  )
}
