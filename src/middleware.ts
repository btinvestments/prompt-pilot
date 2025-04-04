import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';


// Define middleware function
export default async function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/sign-in',
    '/sign-up',
    '/api/webhook',
  ];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || 
    request.nextUrl.pathname.startsWith(route)
  );
  
  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check authentication
  const { userId } = getAuth(request);
  
  // If authenticated, proceed
  if (userId) {
    return NextResponse.next();
  }
  
  // Redirect to sign-in if not authenticated
  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('redirect_url', request.url);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
