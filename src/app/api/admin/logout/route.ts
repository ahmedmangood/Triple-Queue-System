import { NextRequest, NextResponse } from 'next/server'
import { removeSession } from '@/lib/admin-session'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('adminSession')?.value

    if (sessionToken) {
      // Remove session from store using shared utility
      removeSession(sessionToken)
    }

    // Clear the cookie
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    response.cookies.set('adminSession', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Immediately expire
    })

    return response

  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
