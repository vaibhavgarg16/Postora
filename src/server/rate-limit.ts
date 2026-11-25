import { prisma } from "@/server/db"

export async function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = new Date()
  const existing = await prisma.rateLimit.findUnique({ where: { key } })
  if (!existing || existing.resetAt.getTime() <= now.getTime()) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
      update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
    })
    return { ok: true as const }
  }
  if (existing.count >= limit) return { ok: false as const, resetAt: existing.resetAt }
  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } })
  return { ok: true as const }
}
