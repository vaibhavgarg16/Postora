import { cn } from "cn"

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm text-primary-foreground">R</span>
      <span>
        Reeno <span className="font-medium text-muted-foreground">AI</span>
      </span>
    </span>
  )
}
