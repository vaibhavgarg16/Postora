import { Suspense } from "react"
import { VerifyForm } from "@/components/auth/credentials-forms"

export const metadata = { title: "Verify email" }

export default function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading verification…</p>}>
      <VerifyContent searchParams={searchParams} />
    </Suspense>
  )
}

async function VerifyContent({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify email</h1>
        <p className="mt-1 text-sm text-muted-foreground">Confirmation happens only when you submit this form.</p>
      </div>
      {params.token ? <VerifyForm token={params.token} /> : <p className="text-sm text-destructive">This verification link has no token.</p>}
    </div>
  )
}
