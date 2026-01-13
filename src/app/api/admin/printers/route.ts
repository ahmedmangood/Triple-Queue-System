import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const printers = await db.printer.findMany({
      include: {
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(printers)
  } catch (error) {
    console.error('Error fetching printers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, address, port, paperWidth, isActive } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Validate network printer requirements
    if (type === 'NETWORK' && (!address || !port)) {
      return NextResponse.json(
        { error: 'IP address and port are required for network printers' },
        { status: 400 }
      )
    }

    const printer = await db.printer.create({
      data: {
        name,
        type,
        address: type === 'NETWORK' ? address : null,
        port: type === 'NETWORK' ? port : null,
        paperWidth: paperWidth || 80,
        isActive: isActive ?? true
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'printer',
        entityId: printer.id,
        details: JSON.stringify({ name, type }),
        userId: 'admin' // Will be replaced with actual user ID from auth
      }
    })

    return NextResponse.json(printer, { status: 201 })
  } catch (error) {
    console.error('Error creating printer:', error)
    return NextResponse.json(
      { error: 'Failed to create printer' },
      { status: 500 }
    )
  }
}