import Link from "next/link"
import { Live } from "@/components/live"
import { AcceptInvite } from "@/components/team/accept-invite"
import { optionalUser } from "@/server/session"

export const metadata = { title: "Accept invite" }

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Live>
      <InviteContent params={params} />
    </Live>
  )
}

async function InviteContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const user = await optionalUser()
  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-4 px-4">
      <h1 className="text-3xl font-semibold tracking-tight">Join a workspace</h1>
      {user ? (
        <AcceptInvite token={token} email={user.email} />
      ) : (
        <Link className="underline" href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}>
          Sign in to accept this invite
        </Link>
      )}
    </div>
  )
}
