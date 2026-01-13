import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Global Socket.IO instance will be set by the server
declare global {
  var io: any
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId } = body

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Get the service and increment its counter
    const service = await db.service.findUnique({
      where: { id: serviceId }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!service.isActive) {
      return NextResponse.json(
        { error: 'Service is not active' },
        { status: 400 }
      )
    }

    // Increment the service counter
    const updatedService = await db.service.update({
      where: { id: serviceId },
      data: {
        currentNumber: {
          increment: 1
        }
      }
    })

    // Create the ticket
    const ticket = await db.ticket.create({
      data: {
        ticketNumber: updatedService.currentNumber.toString(),
        serviceId: serviceId,
        status: 'WAITING'
      },
      include: {
        service: {
          include: {
            printer: true
          }
        }
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'ticket',
        entityId: ticket.id,
        details: JSON.stringify({ 
          ticketNumber: ticket.ticketNumber,
          serviceCode: service.code,
          serviceName: service.name
        }),
        userId: 'kiosk' // System generated
      }
    })

    // Emit Socket.IO event for real-time updates
    try {
      if (global.io) {
        const ticketData = {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          serviceCode: ticket.service.code,
          serviceName: ticket.service.name,
        }
        
        // Broadcast to staff and admin rooms
        global.io.to('staff-room').emit('ticket-created', ticketData)
        global.io.to('admin-room').emit('ticket-created', ticketData)
        
        console.log('Socket.IO event emitted for ticket created:', ticketData)
      }
    } catch (socketError) {
      console.error('Error emitting Socket.IO event:', socketError)
    }

    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      service: ticket.service,
      issuedAt: ticket.issuedAt
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const serviceIds = searchParams.get('serviceIds')
    
    // Build the where clause based on query parameters
    const whereClause: any = {}
    if (serviceId) {
      whereClause.serviceId = serviceId
    } else if (serviceIds) {
      // Support multiple service IDs (comma-separated)
      const serviceIdArray = serviceIds.split(',').filter(id => id.trim())
      if (serviceIdArray.length > 0) {
        whereClause.serviceId = {
          in: serviceIdArray
        }
      }
    }
    
    const tickets = await db.ticket.findMany({
      where: whereClause,
      include: {
        service: true,
        staff: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limit to last 50 tickets
    })

    return NextResponse.json(tickets)
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}