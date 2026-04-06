import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const pathname = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/sign-up', '/privacy', '/terms', '/help', '/contact', '/support']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // If user is not logged in and trying to access protected route
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
