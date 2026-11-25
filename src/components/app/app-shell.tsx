"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { useState } from "react"
import { APP_NAV } from "@/lib/constants"
import { signOutAction } from "@/server/actions/auth"
import { switchWorkspaceAction } from "@/server/actions/workspace"
import { ThemeToggle } from "@/components/theme-toggle"
import { Wordmark } from "@/components/wordmark"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "cn"

type Membership = { workspaceId: string; name: string }

type Notice = { id: string; title: string; body: string; href: string | null; unread: boolean }

export function AppShell({
  children,
  userName,
  email,
  workspaceName,
  planName,
  role,
  memberships,
  activeWorkspaceId,
  notices,
  isAdmin,
}: {
  children: React.ReactNode
  userName: string
  email: string
  workspaceName: string
  planName: string
  role: string
  memberships: Membership[]
  activeWorkspaceId: string
  notices: Notice[]
  isAdmin: boolean
}) {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:flex md:flex-col">
        <div className="px-4 py-5">
          <Link href="/dashboard">
            <Wordmark />
          </Link>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t px-4 py-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{workspaceName}</p>
          <p className="mt-1">
            {planName} · {role.toLowerCase()}
          </p>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:px-8">
          <MobileNav />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{workspaceName}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          {memberships.length > 1 ? (
            <form action={switchWorkspaceAction}>
              <select
                name="workspaceId"
                defaultValue={activeWorkspaceId}
                className="h-8 rounded-lg border bg-background px-2 text-sm"
                aria-label="Active workspace"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {memberships.map((member) => (
                  <option key={member.workspaceId} value={member.workspaceId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </form>
          ) : null}
          <ThemeToggle />
          <Notices notices={notices} />
          <AccountMenu name={userName} isAdmin={isAdmin} />
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="grid gap-1 px-3">
      {APP_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function MobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation" />}
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>
            <Wordmark />
          </SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}

function Notices({ notices }: { notices: Notice[] }) {
  const unread = notices.filter((notice) => notice.unread).length
  return (
    <details className="relative">
      <summary className="flex h-8 cursor-pointer list-none items-center rounded-lg px-2 text-sm hover:bg-muted">
        Inbox
        {unread > 0 ? (
          <Badge className="ml-2" variant="secondary">
            {unread}
          </Badge>
        ) : null}
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg">
        {notices.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">No notifications yet.</p>
        ) : (
          <ul className="grid gap-1">
            {notices.map((notice) => (
              <li key={notice.id} className="rounded-lg px-2 py-2 text-sm hover:bg-muted">
                <p className="font-medium">{notice.title}</p>
                <p className="text-muted-foreground">{notice.body}</p>
                {notice.href ? (
                  <Link className="underline" href={notice.href}>
                    Open
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

function AccountMenu({ name, isAdmin }: { name: string; isAdmin: boolean }) {
  return (
    <details className="relative">
      <summary className="flex h-8 cursor-pointer list-none items-center rounded-lg px-2 text-sm hover:bg-muted">
        {name}
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-44 rounded-xl border bg-popover p-1 text-sm shadow-lg">
        <Link className="block rounded-lg px-2 py-1.5 hover:bg-muted" href="/settings">
          Settings
        </Link>
        <Link className="block rounded-lg px-2 py-1.5 hover:bg-muted" href="/billing">
          Billing
        </Link>
        {isAdmin ? (
          <Link className="block rounded-lg px-2 py-1.5 hover:bg-muted" href="/admin">
            Admin
          </Link>
        ) : null}
        <form action={signOutAction}>
          <button className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-muted" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </details>
  )
}
