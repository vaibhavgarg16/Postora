export function UnavailableModule({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-primary">Not connected</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      <ul className="mt-6 grid gap-2 text-sm text-muted-foreground">
        <li>This page does not call a social network, an AI provider, or a payment API.</li>
        <li>It does not invent captions, metrics, or publishing results.</li>
      </ul>
    </div>
  )
}
