import { NextResponse } from "next/server"
import { z } from "zod"
import { canManageWorkspace } from "@/lib/access"
import { activatePayment } from "@/server/billing-service"
import { prisma } from "@/server/db"
import { requireWorkspace } from "@/server/session"

const bodySchema = z.object({
  razorpay_order_id: z.string().min(3),
  razorpay_payment_id: z.string().min(3),
  razorpay_signature: z.string().min(3),
})

export async function POST(request: Request) {
  const context = await requireWorkspace()
  if (!canManageWorkspace(context.role)) {
    return NextResponse.json({ error: "Only an owner or admin can confirm payment." }, { status: 403 })
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Payment confirmation is incomplete." }, { status: 400 })
  const attempt = await prisma.paymentAttempt.findUnique({
    where: { razorpayOrderId: parsed.data.razorpay_order_id },
  })
  if (!attempt || attempt.workspaceId !== context.workspace.id) {
    return NextResponse.json({ error: "That order does not belong to this workspace." }, { status: 404 })
  }
  const result = await activatePayment({
    orderId: parsed.data.razorpay_order_id,
    paymentId: parsed.data.razorpay_payment_id,
    signature: parsed.data.razorpay_signature,
  })
  if ("error" in result) return NextResponse.json(result, { status: 400 })
  return NextResponse.json({ ok: true })
}
