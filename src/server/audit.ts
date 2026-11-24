import type { Prisma } from "@prisma/client"
import { prisma } from "@/server/db"

export async function writeAudit(input: {
  action: string
  actorId?: string | null
  workspaceId?: string | null
  targetType?: string
  targetId?: string
  metadata?: Prisma.InputJsonValue
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      actorId: input.actorId ?? null,
      workspaceId: input.workspaceId ?? null,
      targetType: input.targetType,
      targetId: input.targetId,
      metadata: input.metadata,
    },
  })
}
