import { canManageWorkspace } from "@/lib/access"
import { Live } from "@/components/live"
import { InviteForm } from "@/components/team/invite-form"
import { limitFor } from "@/lib/plans"
import { prisma } from "@/server/db"
import { requireWorkspace } from "@/server/session"

export const metadata = { title: "Team" }

export default function TeamPage() {
  return (
    <Live>
      <TeamContent />
    </Live>
  )
}

async function TeamContent() {
  const context = await requireWorkspace()
  const [members, invites] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: context.workspace.id },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId: context.workspace.id, acceptedAt: null, expiresAt: { gt: new Date() } },
    }),
  ])
  const limit = context.limits ? limitFor(context.limits, "teamMembers") : 0
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Team</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {members.length} of {limit} seats used, plus {invites.length} open invite{invites.length === 1 ? "" : "s"}.
        </p>
      </div>
      <ul className="grid gap-2">
        {members.map((member) => (
          <li key={member.id} className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm">
            <span>
              {member.user.name ?? member.user.email}
              <span className="block text-muted-foreground">{member.user.email}</span>
            </span>
            <span>{member.role.toLowerCase()}</span>
          </li>
        ))}
      </ul>
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="font-semibold">Invite</h2>
        <div className="mt-4">
          <InviteForm canInvite={canManageWorkspace(context.role)} />
        </div>
      </section>
    </div>
  )
}
