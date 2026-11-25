import { headers } from "next/headers"

export async function appOrigin() {
  const headerStore = await headers()
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
  if (!host) return process.env.AUTH_URL ?? "http://localhost:3000"
  const forwarded = headerStore.get("x-forwarded-proto")
  const proto = forwarded ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
  return `${proto}://${host}`
}
