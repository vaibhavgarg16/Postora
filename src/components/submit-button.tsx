"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
}: {
  children: React.ReactNode
  pendingLabel?: string
}) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="h-10 px-4">
      {pending ? pendingLabel : children}
    </Button>
  )
}
