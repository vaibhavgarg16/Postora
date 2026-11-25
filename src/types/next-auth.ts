import type { DefaultSession } from "next-auth"
import type { PlatformRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      platformRole: PlatformRole
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    platformRole?: PlatformRole
  }
}

export {}
