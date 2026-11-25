import Link from "next/link"
import { Wordmark } from "@/components/wordmark"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex">
          <Wordmark />
        </Link>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  )
}
