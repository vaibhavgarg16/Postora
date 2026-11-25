import { Live } from "@/components/live"
import { prisma } from "@/server/db"
import { requireWorkspace } from "@/server/session"

export const metadata = { title: "Calendar" }

export default function CalendarPage() {
  return (
    <Live>
      <CalendarContent />
    </Live>
  )
}

async function CalendarContent() {
  const context = await requireWorkspace()
  const scheduled = await prisma.post.count({ where: { workspaceId: context.workspace.id, status: "SCHEDULED" } })
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-primary">Not connected</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Calendar</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Monthly, weekly, and daily scheduling is not available yet. Drag and drop would write real publish times, so it
        is not shown until the queue exists.
      </p>
      <p className="mt-4 text-sm">Scheduled posts in this workspace: {scheduled}</p>
    </div>
  )
}
