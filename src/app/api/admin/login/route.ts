import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/admin-session'

// Default admin credentials (in production, these should be in environment variables)
const DEFAULT_ADMIN_USERNAME = 'admin'
const DEFAULT_ADMIN_PASSWORD = '123456'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Check credentials
    if (username !== DEFAULT_ADMIN_USERNAME || password !== DEFAULT_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session using shared utility
    const sessionToken = createSession(username)

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      username: username,
      sessionToken: sessionToken
    })

    response.cookies.set('adminSession', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response

  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
