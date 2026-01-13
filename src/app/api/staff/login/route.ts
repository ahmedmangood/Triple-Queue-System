import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find staff member by email
    const staff = await db.staff.findUnique({
      where: { email },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if staff is active
    if (!staff.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, staff.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session token (simple implementation - in production, use JWT)
    const sessionToken = Buffer.from(`${staff.id}:${Date.now()}`).toString('base64')

    // Store session in a simple way (in production, use Redis or database)
    // For now, we'll use a cookie-based approach

    // Log the login
    await db.auditLog.create({
      data: {
        action: 'LOGIN',
        entity: 'staff',
        entityId: staff.id,
        details: JSON.stringify({ email, timestamp: new Date().toISOString() }),
        userId: staff.id
      }
    })

    // Return staff data without password
    const { password: _, ...staffData } = staff

    // Create response with session cookie
    const response = NextResponse.json({
      message: 'Login successful',
      staff: staffData,
      token: sessionToken
    })

    // Set HTTP-only cookie for session
    response.cookies.set('staff-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error during staff login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}