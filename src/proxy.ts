import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PROTECTED = [
  "/dashboard",
  "/content-studio",
  "/calendar",
  "/posts",
  "/social-accounts",
  "/analytics",
  "/competitors",
  "/recommendations",
  "/team",
  "/settings",
  "/billing",
  "/onboarding",
  "/admin",
  "/invite",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const needsAuth = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  if (!needsAuth) return NextResponse.next()

  const token =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!token) {
    const login = new URL("/login", request.url)
    login.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
