"use client"

import { useActionState } from "react"
import { acceptInviteFormAction, type ActionState } from "@/server/actions/workspace"
import { ActionNote } from "@/components/action-note"
import { SubmitButton } from "@/components/submit-button"

const initial: ActionState = {}

export function AcceptInvite({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState(acceptInviteFormAction, initial)
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted-foreground">Signed in as {email}. The invite email must match.</p>
      <ActionNote error={state.error} />
      <SubmitButton pendingLabel="Joining…">Accept invite</SubmitButton>
    </form>
  )
}
