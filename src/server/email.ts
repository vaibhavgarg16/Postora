type Mail = {
  to: string
  subject: string
  text: string
}

export async function sendMail(mail: Mail) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) return { delivered: false as const }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error("[reeno] email delivery failed", response.status, body.slice(0, 300))
    return { delivered: false as const }
  }
  return { delivered: true as const }
}

export function devMailLinkAllowed() {
  return process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY
}
