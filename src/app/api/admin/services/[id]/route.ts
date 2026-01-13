import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = await db.service.findUnique({
      where: { id: params.id },
      include: {
        printer: true,
        staff: {
          include: {
            staff: {
              select: {
                id: true,
                name: true,
                username: true,
                role: true
              }
            }
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      name, 
      code, 
      color, 
      description, 
      nameAr, 
      nameUr, 
      nameBn, 
      descriptionAr, 
      descriptionUr, 
      descriptionBn,
      isActive, 
      printerId 
    } = body

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

    // Check if new code conflicts with existing service
    if (code && code !== existingService.code) {
      const conflictingService = await db.service.findFirst({
        where: { code }
      })

      if (conflictingService) {
        return NextResponse.json(
          { error: 'Service code already exists' },
          { status: 400 }
        )
      }
    }

    const service = await db.service.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
        ...(nameAr !== undefined && { nameAr }),
        ...(nameUr !== undefined && { nameUr }),
        ...(nameBn !== undefined && { nameBn }),
        ...(descriptionAr !== undefined && { descriptionAr }),
        ...(descriptionUr !== undefined && { descriptionUr }),
        ...(descriptionBn !== undefined && { descriptionBn }),
        ...(isActive !== undefined && { isActive }),
        ...(printerId !== undefined && { printerId: printerId && printerId !== 'none' ? printerId : null })
      },
      include: {
        printer: true
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'service',
        entityId: service.id,
        details: JSON.stringify({ name, code, isActive }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if service exists
    const existingService = await db.service.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            tickets: true
          }
        }
      }
    })

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Check if service has tickets
    if (existingService._count.tickets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service with existing tickets' },
        { status: 400 }
      )
    }

    await db.service.delete({
      where: { id: params.id }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'service',
        entityId: params.id,
        details: JSON.stringify({ name: existingService.name }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    )
  }
}