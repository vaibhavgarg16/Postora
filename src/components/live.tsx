import { Suspense } from "react"

export function Live({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-muted" />}>{children}</Suspense>
}
