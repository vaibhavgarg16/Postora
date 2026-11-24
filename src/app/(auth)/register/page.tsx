import { RegisterForm } from "@/components/auth/credentials-forms"

export const metadata = { title: "Create account" }

export default function RegisterPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">You will verify the email before the workspace opens.</p>
      </div>
      <RegisterForm />
    </div>
  )
}
