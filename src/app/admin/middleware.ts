import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/admin-session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and static assets
  if (pathname === '/admin/login' || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/api') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // Check for admin session
  const sessionToken = request.cookies.get('adminSession')?.value

  if (!sessionToken) {
    // Redirect to login if no session
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Validate session using shared utility
  const validation = validateSession(sessionToken)
  
  if (!validation.valid) {
    // Session expired or invalid, redirect to login
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Session is valid, continue
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*'
}