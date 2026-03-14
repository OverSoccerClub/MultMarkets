import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;
    const { pathname } = request.nextUrl;

    // Protected user routes
    const userProtectedRoutes = ['/wallet', '/dashboard', '/orders', '/profile'];
    const isUserRoute = userProtectedRoutes.some(path => pathname.startsWith(path));

    // Protected admin routes
    const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

    if (isUserRoute || isAdminRoute) {
        if (!token) {
            const loginUrl = new URL(isAdminRoute ? '/admin/login' : '/auth/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect authenticated users away from login pages
    if (token && (pathname === '/auth/login' || pathname === '/auth/register' || pathname === '/admin/login')) {
        return NextResponse.redirect(new URL(pathname.startsWith('/admin') ? '/admin' : '/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/wallet/:path*',
        '/dashboard/:path*',
        '/orders/:path*',
        '/profile/:path*',
        '/admin/:path*',
        '/auth/:path*',
    ],
};
