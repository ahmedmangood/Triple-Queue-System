import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Check if staff member exists
    const existingStaff = await db.staff.findUnique({
      where: { id: params.id }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update the password
    await db.staff.update({
      where: { id: params.id },
      data: {
        password: hashedPassword
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'RESET_PASSWORD',
        entity: 'staff',
        entityId: params.id,
        details: JSON.stringify({ 
          staffName: existingStaff.name,
          resetBy: 'admin'
        }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json({ 
      message: 'Password reset successfully'
    })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}