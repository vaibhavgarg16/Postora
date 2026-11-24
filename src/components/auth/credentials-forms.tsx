"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ActionNote } from "@/components/action-note"
import { SubmitButton } from "@/components/submit-button"
import {
  forgotPasswordAction,
  googleSignInAction,
  loginAction,
  registerAction,
  resendVerificationAction,
  resetPasswordAction,
  verifyEmailAction,
  type ActionState,
} from "@/server/actions/auth"

const initial: ActionState = {}

export function LoginForm({ callbackUrl, googleEnabled }: { callbackUrl: string; googleEnabled: boolean }) {
  const [state, action] = useActionState(loginAction, initial)
  return (
    <div className="grid gap-5">
      {googleEnabled ? (
        <form action={googleSignInAction}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="outline" className="h-10 w-full">
            Continue with Google
          </Button>
        </form>
      ) : null}
      <form action={action} className="grid gap-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
        <ActionNote error={state.error} message={state.message} />
        <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
      </form>
      <div className="flex justify-between text-sm">
        <Link className="underline" href="/forgot-password">
          Forgot password
        </Link>
        <Link className="underline" href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
          Create an account
        </Link>
      </div>
      <ResendForm />
    </div>
  )
}

function ResendForm() {
  const [state, action] = useActionState(resendVerificationAction, initial)
  return (
    <form action={action} className="grid gap-3 border-t pt-4">
      <p className="text-sm text-muted-foreground">Need another verification email?</p>
      <Field label="Account email" name="email" type="email" />
      <ActionNote error={state.error} message={state.message} devLink={state.devLink} />
      <SubmitButton pendingLabel="Sending…">Resend verification</SubmitButton>
    </form>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState(registerAction, initial)
  return (
    <form action={action} className="grid gap-4">
      <Field label="Name" name="name" autoComplete="name" />
      {state.fieldErrors?.name ? <FieldError messages={state.fieldErrors.name} /> : null}
      <Field label="Email" name="email" type="email" autoComplete="email" />
      {state.fieldErrors?.email ? <FieldError messages={state.fieldErrors.email} /> : null}
      <Field label="Password" name="password" type="password" autoComplete="new-password" />
      {state.fieldErrors?.password ? <FieldError messages={state.fieldErrors.password} /> : null}
      <ActionNote error={state.error} message={state.message} devLink={state.devLink} />
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link className="underline" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  )
}

export function ForgotForm() {
  const [state, action] = useActionState(forgotPasswordAction, initial)
  return (
    <form action={action} className="grid gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <ActionNote error={state.error} message={state.message} devLink={state.devLink} />
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  )
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, initial)
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <Field label="New password" name="password" type="password" autoComplete="new-password" />
      <ActionNote error={state.error} message={state.message} />
      {state.message ? (
        <Link className="text-sm underline" href="/login">
          Go to sign in
        </Link>
      ) : null}
      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  )
}

export function VerifyForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyEmailAction, initial)
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="token" value={token} />
      <ActionNote error={state.error} message={state.message} />
      <SubmitButton pendingLabel="Verifying…">Verify email</SubmitButton>
      {state.message ? (
        <Link className="text-sm underline" href="/login">
          Sign in
        </Link>
      ) : null}
    </form>
  )
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  autoComplete?: string
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} autoComplete={autoComplete} required className="h-10" />
    </div>
  )
}

function FieldError({ messages }: { messages: string[] }) {
  return <p className="text-sm text-destructive">{messages[0]}</p>
}
