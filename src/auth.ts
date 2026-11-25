import NextAuth, { CredentialsSignin } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import type { PlatformRole } from "@prisma/client"
import { prisma } from "@/server/db"
import "@/types/next-auth"

class EmailNotVerified extends CredentialsSignin {
  code = "email_not_verified"
}

const providers = []

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  )
}

providers.push(
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = String(credentials?.email ?? "")
        .toLowerCase()
        .trim()
      const password = String(credentials?.password ?? "")
      if (!email || !password) return null
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user?.passwordHash) return null
      const matches = await compare(password, user.passwordHash)
      if (!matches) return null
      if (!user.emailVerified) throw new EmailNotVerified()
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      }
    },
  }),
)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const record = await prisma.user.findUnique({ where: { id: user.id } })
        token.platformRole = record?.platformRole ?? "USER"
      } else if (token.sub && !token.platformRole) {
        const record = await prisma.user.findUnique({ where: { id: token.sub } })
        token.platformRole = record?.platformRole ?? "USER"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.platformRole = (token.platformRole as PlatformRole | undefined) ?? "USER"
      }
      return session
    },
  },
})
