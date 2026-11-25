import { Live } from "@/components/live"
import { AppShell } from "@/components/app/app-shell"
import { prisma } from "@/server/db"
import { isPlatformAdmin, requireWorkspace } from "@/server/session"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Live>
      <Frame>{children}</Frame>
    </Live>
  )
}

async function Frame({ children }: { children: React.ReactNode }) {
  const context = await requireWorkspace()
  const notices = await prisma.notification.findMany({
    where: { userId: context.user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  })
  return (
    <AppShell
      userName={context.user.name ?? context.user.email}
      email={context.user.email}
      workspaceName={context.workspace.name}
      planName={context.planName}
      role={context.role}
      activeWorkspaceId={context.workspace.id}
      memberships={context.memberships.map((member) => ({
        workspaceId: member.workspaceId,
        name: member.workspace.name,
      }))}
      notices={notices.map((notice) => ({
        id: notice.id,
        title: notice.title,
        body: notice.body,
        href: notice.href,
        unread: notice.readAt === null,
      }))}
      isAdmin={isPlatformAdmin(context.user)}
    >
      {children}
    </AppShell>
  )
}
