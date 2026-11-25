export function ActionNote({
  error,
  message,
  devLink,
}: {
  error?: string
  message?: string
  devLink?: string
}) {
  if (!error && !message && !devLink) return null
  return (
    <div className="grid gap-2 text-sm">
      {error ? <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">{error}</p> : null}
      {message ? <p className="rounded-lg bg-accent px-3 py-2 text-accent-foreground">{message}</p> : null}
      {devLink ? (
        <p className="rounded-lg border border-dashed px-3 py-2 text-muted-foreground">
          Development only. Email is not configured, so this link is shown here instead of being sent.{" "}
          <a className="font-medium text-foreground underline" href={devLink}>
            Open link
          </a>
        </p>
      ) : null}
    </div>
  )
}
