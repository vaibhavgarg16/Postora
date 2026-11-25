import Link from "next/link"
import { ForgotForm } from "@/components/auth/credentials-forms"

export const metadata = { title: "Forgot password" }

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-1 text-sm text-muted-foreground">We will not say whether the email is registered.</p>
      </div>
      <ForgotForm />
      <Link className="text-sm underline" href="/login">
        Back to sign in
      </Link>
    </div>
  )
}
