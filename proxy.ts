import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Next.js Proxy (Middleware) to handle authentication globally.
 */
export async function proxy(request: NextRequest) {
    // 1. Get the session using the request headers
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    const { pathname } = request.nextUrl;

    // 2. Define the logic for authentication redirects
    // Skip if user is on login page or API auth routes
    if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
        // If logged in and trying to access /login, go to home
        if (session && pathname.startsWith("/login")) {
            return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
    }

    // 3. If no session, redirect to login
    if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 4. If session exists, proceed
    return NextResponse.next();
}

/**
 * Matcher configuration for the Proxy.
 * Excludes static files, Next.js internal files, and favicon.
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (unless it's auth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - icon.svg (icon file)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)",
    ],
};
