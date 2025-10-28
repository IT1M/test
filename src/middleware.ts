import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { hasRouteAccess, getDefaultDashboard } from '@/utils/rbac';
import { routing } from '@/i18n/routing';

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/register'];

// Define auth routes (redirect to dashboard if already authenticated)
const authRoutes = ['/login', '/register'];

/**
 * Check if path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  // Remove locale prefix
  const cleanPath = pathname.replace(/^\/(en|ar)/, '');
  
  return publicRoutes.some(
    (route) => cleanPath === route || cleanPath.startsWith(`${route}/`)
  );
}

/**
 * Check if path is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  // Remove locale prefix
  const cleanPath = pathname.replace(/^\/(en|ar)/, '');
  
  return authRoutes.some(
    (route) => cleanPath === route || cleanPath.startsWith(`${route}/`)
  );
}

// Create the next-intl middleware
const handleI18nRouting = createMiddleware(routing);

// Main middleware function
export default auth(async function middleware(request) {
  const { pathname } = request.nextUrl;

  console.log(`[Middleware] Processing: ${pathname}`);

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // files with extensions
  ) {
    console.log(`[Middleware] Skipping static/API route: ${pathname}`);
    return NextResponse.next();
  }

  // Handle i18n routing first
  const i18nResponse = handleI18nRouting(request as NextRequest);
  
  // If i18n middleware redirected, return that response
  if (i18nResponse.status === 307 || i18nResponse.status === 302) {
    console.log(`[Middleware] i18n redirect for: ${pathname}`);
    return i18nResponse;
  }

  // Get the locale from the pathname
  const locale = pathname.split('/')[1] || routing.defaultLocale;
  console.log(`[Middleware] Detected locale: ${locale}`);

  // Get session
  const session = request.auth;
  console.log(`[Middleware] Session exists: ${!!session}`);

  // Handle authentication
  if (!session) {
    // Allow access to public routes
    if (isPublicRoute(pathname)) {
      console.log(`[Middleware] Allowing public route: ${pathname}`);
      return i18nResponse;
    }

    // Redirect to login for protected routes
    console.log(`[Middleware] Redirecting to login for protected route: ${pathname}`);
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated
  const userRole = session.user.role;
  console.log(`[Middleware] User role: ${userRole}`);

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(pathname)) {
    console.log(`[Middleware] Redirecting authenticated user away from auth page: ${pathname}`);
    const dashboardUrl = new URL(
      `/${locale}${getDefaultDashboard(userRole)}`,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Check role-based access
  if (!hasRouteAccess(userRole, pathname)) {
    console.log(`[Middleware] Access denied for role ${userRole} to ${pathname}`);
    // Redirect to appropriate dashboard if no access
    const dashboardUrl = new URL(
      `/${locale}${getDefaultDashboard(userRole)}`,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Handle root path redirect
  if (pathname === `/${locale}` || pathname === `/${locale}/`) {
    console.log(`[Middleware] Redirecting root path to dashboard: ${pathname}`);
    const dashboardUrl = new URL(
      `/${locale}${getDefaultDashboard(userRole)}`,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  console.log(`[Middleware] Allowing access to: ${pathname}`);
  return i18nResponse;
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
  runtime: 'nodejs',
};
