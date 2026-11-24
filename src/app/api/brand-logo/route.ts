import { readFile } from "node:fs/promises"
import path from "node:path"
import { requireWorkspace } from "@/server/session"

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

export async function GET() {
  const context = await requireWorkspace()
  const logoPath = context.workspace.profile?.logoPath
  if (!logoPath) return new Response("No logo", { status: 404 })
  const root = path.join(process.cwd(), "storage")
  const full = path.resolve(root, logoPath)
  if (!full.startsWith(root + path.sep)) return new Response("Invalid logo path", { status: 400 })
  const bytes = await readFile(full)
  return new Response(bytes, {
    headers: {
      "Content-Type": TYPES[path.extname(full)] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=300",
    },
  })
}
