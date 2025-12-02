import type { NextAuthConfig } from "next-auth"

// Auth configuration for Edge Runtime (middleware)
// This config doesn't include Prisma to work in Edge Runtime
export const authConfig = {
  // Trust host for Railway/Vercel deployment
  trustHost: true,

  providers: [], // Providers will be added in auth.ts to avoid Prisma in Edge Runtime

  pages: {
    signIn: '/auth/signin',
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      // Public routes that don't require authentication
      const publicRoutes = [
        "/",
        "/auth/signin",
        "/auth/signup",
        "/auth/error",
      ]

      // Public display pages (auction display is public for viewing)
      const isPublicDisplayPage = pathname.match(/^\/auction\/[^/]+\/display$/)

      // API routes are handled by their own authentication
      const isApiRoute = pathname.startsWith("/api")

      // Static files and Next.js internals
      const isNextInternal = pathname.startsWith("/_next") || pathname.startsWith("/favicon")

      // Allow access to public routes
      if (publicRoutes.includes(pathname) || isPublicDisplayPage || isApiRoute || isNextInternal) {
        return true
      }

      // Redirect to signin if not authenticated
      if (!isLoggedIn) {
        return false // Will redirect to signIn page
      }

      // Role-based access control
      const userRole = auth?.user?.role
      const isAdminRoute = pathname.startsWith("/admin")
      const isTeamOwnerRoute = pathname.startsWith("/team-owner") || pathname.match(/^\/auction\/[^/]+\/bid$/)

      if (isAdminRoute && userRole !== "ADMIN") {
        // Non-admin trying to access admin routes
        return Response.redirect(new URL("/auth/signin?error=unauthorized", nextUrl))
      }

      if (isTeamOwnerRoute && userRole !== "TEAM_OWNER" && userRole !== "ADMIN") {
        // Non-team-owner trying to access team owner routes (admins are allowed)
        return Response.redirect(new URL("/auth/signin?error=unauthorized", nextUrl))
      }

      return true
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user as any).role
      }
      return token
    }
  },

  session: {
    strategy: "jwt" as const
  },

  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
