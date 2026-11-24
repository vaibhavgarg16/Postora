import { NextResponse } from "next/server"
import { z } from "zod"
import { canManageWorkspace } from "@/lib/access"
import { createCheckoutOrder } from "@/server/billing-service"
import { requireWorkspace } from "@/server/session"

const bodySchema = z.object({
  planCode: z.string().min(2),
  interval: z.enum(["MONTHLY", "YEARLY"]),
})

export async function POST(request: Request) {
  const context = await requireWorkspace()
  if (!canManageWorkspace(context.role)) {
    return NextResponse.json({ error: "Only an owner or admin can change the plan." }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose a plan and billing interval." }, { status: 400 })
  const result = await createCheckoutOrder({
    workspaceId: context.workspace.id,
    planCode: parsed.data.planCode,
    interval: parsed.data.interval,
  })
  if ("error" in result) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result)
}
