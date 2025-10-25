import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/services/auth";
import { hasRouteAccess, getDefaultDashboard } from "@/utils/rbac";

// Define public routes that don't require authentication
const publicRoutes = ["/login", "/register"];

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = ["/login", "/register"];

// Supported locales
const locales = ["en", "ar"];
const defaultLocale = "en";

/**
 * Get locale from pathname or return default
 */
function getLocale(pathname: string): string {
  const segments = pathname.split("/");
  const potentialLocale = segments[1];

  if (locales.includes(potentialLocale)) {
    return potentialLocale;
  }

  return defaultLocale;
}

/**
 * Check if path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  // Remove locale prefix
  const cleanPath = pathname.replace(/^\/(en|ar)/, "");

  return publicRoutes.some((route) =>
    cleanPath === route || cleanPath.startsWith(`${route}/`)
  );
}

/**
 * Check if path is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  // Remove locale prefix
  const cleanPath = pathname.replace(/^\/(en|ar)/, "");

  return authRoutes.some((route) =>
    cleanPath === route || cleanPath.startsWith(`${route}/`)
  );
}

export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // files with extensions
  ) {
    return NextResponse.next();
  }

  // Get current locale
  const locale = getLocale(pathname);

  // Add locale to pathname if not present
  if (!pathname.startsWith(`/${locale}`)) {
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Get session
  const session = request.auth;

  // Handle authentication
  if (!session) {
    // Allow access to public routes
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Redirect to login for protected routes
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated
  const userRole = session.user.role;

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname)) {
    const dashboardUrl = new URL(
      `/${locale}${getDefaultDashboard(userRole)}`,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Check role-based access
  if (!hasRouteAccess(userRole, pathname)) {
    // Redirect to appropriate dashboard if no access
    const dashboardUrl = new URL(
      `/${locale}${getDefaultDashboard(userRole)}`,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Handle root path redirect
  if (pathname === `/${locale}` || pathname === `/${locale}/`) {
    const dashboardUrl = new URL(
      `/${locale}${getDefaultDashboard(userRole)}`,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};
