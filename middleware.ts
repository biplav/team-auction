import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth
  const userRole = req.auth?.user?.role

  // Public routes that don't require authentication
  const publicRoutes = [
    "/", // Homepage/landing page
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
    return NextResponse.next()
  }

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    const signInUrl = new URL("/auth/signin", req.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Role-based access control
  const isAdminRoute = pathname.startsWith("/admin")
  const isTeamOwnerRoute = pathname.startsWith("/team-owner") || pathname.match(/^\/auction\/[^/]+\/bid$/)

  if (isAdminRoute && userRole !== "ADMIN") {
    // Non-admin trying to access admin routes
    return NextResponse.redirect(new URL("/auth/signin?error=unauthorized", req.url))
  }

  if (isTeamOwnerRoute && userRole !== "TEAM_OWNER" && userRole !== "ADMIN") {
    // Non-team-owner trying to access team owner routes (admins are allowed)
    return NextResponse.redirect(new URL("/auth/signin?error=unauthorized", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
