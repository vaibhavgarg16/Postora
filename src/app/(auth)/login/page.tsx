import { Suspense } from "react"
import { LoginForm } from "@/components/auth/credentials-forms"
import { safeCallbackPath } from "@/lib/slug"

export const metadata = { title: "Sign in" }

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign in…</p>}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginContent({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const params = await searchParams
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use the email and password for your Reeno workspace.</p>
      </div>
      <LoginForm
        callbackUrl={safeCallbackPath(params.callbackUrl)}
        googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
      />
    </div>
  )
}
