import { Suspense } from "react"
import { ResetForm } from "@/components/auth/credentials-forms"

export const metadata = { title: "Choose a new password" }

export default function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading reset form…</p>}>
      <ResetContent searchParams={searchParams} />
    </Suspense>
  )
}

async function ResetContent({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      {params.token ? <ResetForm token={params.token} /> : <p className="text-sm text-destructive">This reset link has no token.</p>}
    </div>
  )
}
