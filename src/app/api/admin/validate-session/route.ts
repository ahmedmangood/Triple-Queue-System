import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/admin-session'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('adminSession')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'No session token' },
        { status: 401 }
      )
    }

    // Validate session using shared utility
    const validation = validateSession(sessionToken)
    
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      )
    }

    // Session is valid
    return NextResponse.json({
      valid: true,
      username: validation.username
    })

  } catch (error) {
    console.error('Session validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
