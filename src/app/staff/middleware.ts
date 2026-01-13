import { NextRequest, NextResponse } from 'next/server'
import { getStaffFromRequest } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // Skip authentication for login page
  if (request.nextUrl.pathname === '/staff/login') {
    return NextResponse.next()
  }

  // Check if staff is authenticated
  const staff = await getStaffFromRequest(request)

  if (!staff) {
    // Redirect to login page
    const loginUrl = new URL('/staff/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/staff/:path*'
}