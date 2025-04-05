import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * List of public routes that don't require authentication
 */
const publicRoutes = [
  "/",              // Home page
  "/sign-in",       // Sign in page
  "/sign-up",       // Sign up page
  "/api/webhook",   // Webhook endpoint
];

/**
 * Helper function to check if a path is public
 */
function isPublicPath(path: string) {
  return publicRoutes.some(publicPath => {
    // Handle wildcard paths (e.g., /sign-in/*)  
    if (path === publicPath) return true;
    if (path.startsWith(`${publicPath}/`)) return true;
    return false;
  });
}

/**
 * Clerk middleware for Next.js
 * This middleware protects all routes except those specified in publicRoutes
 */
export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  
  // For debugging purposes
  console.log("Middleware running for path:", pathname);
  
  // Allow access to public routes without authentication
  if (isPublicPath(pathname)) {
    console.log("Public route accessed:", pathname);
    return NextResponse.next();
  }
  
  // Get the auth object which contains user information
  const { userId } = await auth();
  
  // If user is not authenticated and trying to access a protected route,
  // redirect to the sign-in page
  if (!userId) {
    console.log("Unauthorized access attempt, redirecting to sign-in");
    const signInUrl = new URL('/sign-in', req.url);
    // Use 'redirect' parameter which matches what the sign-in page expects
    signInUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // User is authenticated, allow access to protected route
  return NextResponse.next();
});

/**
 * Configure the middleware matcher
 * - "/((?!.*\\..*).*)$" matches all routes except those with file extensions
 * - "/" matches the root path
 * - "/(api|trpc)(.*)" matches all API and tRPC routes
 */
export const config = {
  matcher: ["/((?!.*\\..*).*)$", "/", "/(api|trpc)(.*)"],
};
