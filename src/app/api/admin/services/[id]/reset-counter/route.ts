import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if service exists
    const existingService = await db.service.findUnique({
      where: { id: params.id }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Reset the counter
    const service = await db.service.update({
      where: { id: params.id },
      data: {
        currentNumber: 0
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'RESET_COUNTER',
        entity: 'service',
        entityId: service.id,
        details: JSON.stringify({ 
          serviceName: existingService.name,
          previousCounter: existingService.currentNumber 
        }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json({ 
      message: 'Service counter reset successfully',
      service: service
    })
  } catch (error) {
    console.error('Error resetting service counter:', error)
    return NextResponse.json(
      { error: 'Failed to reset service counter' },
      { status: 500 }
    )
  }
}