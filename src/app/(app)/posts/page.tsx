import { Live } from "@/components/live"
import { prisma } from "@/server/db"
import { requireWorkspace } from "@/server/session"

export const metadata = { title: "Posts" }

export default function PostsPage() {
  return (
    <Live>
      <PostsContent />
    </Live>
  )
}

async function PostsContent() {
  const context = await requireWorkspace()
  const posts = await prisma.post.findMany({
    where: { workspaceId: context.workspace.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Posts</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Draft creation and publishing are not connected. The list below is the real post table for this workspace.
      </p>
      {posts.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No posts stored.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-2xl border bg-card p-4">
              <p className="font-medium">{post.title || "Untitled"}</p>
              <p className="text-sm text-muted-foreground">{post.status}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
