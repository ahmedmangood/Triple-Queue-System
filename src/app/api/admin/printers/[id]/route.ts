import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const printer = await db.printer.findUnique({
      where: { id: params.id },
      include: {
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      }
    })

    if (!printer) {
      return NextResponse.json(
        { error: 'Printer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(printer)
  } catch (error) {
    console.error('Error fetching printer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printer' },
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
    const { name, type, address, port, paperWidth, isActive } = body

    // Check if printer exists
    const existingPrinter = await db.printer.findUnique({
      where: { id: params.id }
    })

    if (!existingPrinter) {
      return NextResponse.json(
        { error: 'Printer not found' },
        { status: 404 }
      )
    }

    // Validate network printer requirements
    if (type === 'NETWORK' && (!address || !port)) {
      return NextResponse.json(
        { error: 'IP address and port are required for network printers' },
        { status: 400 }
      )
    }

    const printer = await db.printer.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(address !== undefined && { address: type === 'NETWORK' ? address : null }),
        ...(port !== undefined && { port: type === 'NETWORK' ? port : null }),
        ...(paperWidth !== undefined && { paperWidth }),
        ...(isActive !== undefined && { isActive })
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'printer',
        entityId: printer.id,
        details: JSON.stringify({ name, type, isActive }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json(printer)
  } catch (error) {
    console.error('Error updating printer:', error)
    return NextResponse.json(
      { error: 'Failed to update printer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if printer exists
    const existingPrinter = await db.printer.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    })

    if (!existingPrinter) {
      return NextResponse.json(
        { error: 'Printer not found' },
        { status: 404 }
      )
    }

    // Check if printer is assigned to services
    if (existingPrinter._count.services > 0) {
      return NextResponse.json(
        { error: 'Cannot delete printer assigned to services' },
        { status: 400 }
      )
    }

    await db.printer.delete({
      where: { id: params.id }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'printer',
        entityId: params.id,
        details: JSON.stringify({ name: existingPrinter.name }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json({ message: 'Printer deleted successfully' })
  } catch (error) {
    console.error('Error deleting printer:', error)
    return NextResponse.json(
      { error: 'Failed to delete printer' },
      { status: 500 }
    )
  }
}