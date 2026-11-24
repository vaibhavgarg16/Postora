import { NextResponse } from "next/server"
import { verifyRazorpayWebhookSignature } from "@/lib/billing"
import { activatePayment } from "@/server/billing-service"

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 })
  const body = await request.text()
  const signature = request.headers.get("x-razorpay-signature") ?? ""
  if (!verifyRazorpayWebhookSignature({ body, signature, secret })) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 })
  }
  const event = JSON.parse(body) as {
    event?: string
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } }
  }
  if (event.event !== "payment.captured") return NextResponse.json({ ignored: true })
  const payment = event.payload?.payment?.entity
  if (!payment?.id || !payment.order_id) {
    return NextResponse.json({ error: "Webhook payload is missing payment details." }, { status: 400 })
  }
  const result = await activatePayment({
    orderId: payment.order_id,
    paymentId: payment.id,
    webhook: true,
  })
  if ("error" in result) return NextResponse.json(result, { status: 400 })
  return NextResponse.json({ ok: true })
}
