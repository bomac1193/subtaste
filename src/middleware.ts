import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware (Stub Mode)
 *
 * Pass-through middleware for development without Supabase auth.
 * Replace with real Supabase session refresh when configured.
 */
export async function middleware(request: NextRequest) {
  // In stub mode, just pass through without auth checks
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
