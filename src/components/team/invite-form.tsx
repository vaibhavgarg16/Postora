"use client"

import { useActionState } from "react"
import { inviteMemberAction, type ActionState } from "@/server/actions/workspace"
import { ActionNote } from "@/components/action-note"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initial: ActionState = {}

export function InviteForm({ canInvite }: { canInvite: boolean }) {
  const [state, action] = useActionState(inviteMemberAction, initial)
  if (!canInvite) {
    return <p className="text-sm text-muted-foreground">Only an owner or admin can invite people.</p>
  }
  return (
    <form action={action} className="grid gap-3">
      <Label htmlFor="invite-email">Email</Label>
      <Input id="invite-email" name="email" type="email" required className="h-10" />
      <Label htmlFor="invite-role">Role</Label>
      <select id="invite-role" name="role" defaultValue="EDITOR" className="h-10 rounded-lg border bg-background px-3">
        <option value="ADMIN">Admin</option>
        <option value="EDITOR">Editor</option>
        <option value="VIEWER">Viewer</option>
      </select>
      <ActionNote error={state.error} message={state.message} devLink={state.devLink} />
      <SubmitButton pendingLabel="Inviting…">Send invite</SubmitButton>
    </form>
  )
}
