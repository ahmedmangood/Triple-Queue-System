import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Global Socket.IO instance will be set by the server
declare global {
  var io: any
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { serviceId, staffId } = body

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Validate service exists and is active
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

    // Validate staffId if provided
    let validStaffId = null
    if (staffId) {
      const staff = await db.staff.findUnique({
        where: { id: staffId }
      })
      if (staff) {
        validStaffId = staffId
      }
    }

    // Find the next ticket in FIFO order (oldest first)
    const nextTicket = await db.ticket.findFirst({
      where: {
        serviceId: serviceId,
        status: 'WAITING'
      },
      orderBy: {
        createdAt: 'asc' // FIFO: oldest ticket first
      },
      include: {
        service: true
      }
    })

    if (!nextTicket) {
      return NextResponse.json(
        { error: 'No waiting tickets found for this service' },
        { status: 404 }
      )
    }

    // Calculate waiting time
    const waitingTime = Math.floor(
      (new Date().getTime() - new Date(nextTicket.issuedAt).getTime()) / (1000 * 60)
    )

    // Update the ticket status to CALLED
    const updatedTicket = await db.ticket.update({
      where: { id: nextTicket.id },
      data: {
        status: 'CALLED',
        staffId: validStaffId,
        calledAt: new Date(),
        waitingTime
      },
      include: {
        service: true,
        staff: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    // Log the action
    await db.auditLog.create({
      data: {
        action: 'CALL_NEXT',
        entity: 'ticket',
        entityId: nextTicket.id,
        details: JSON.stringify({ 
          ticketNumber: nextTicket.ticketNumber,
          serviceCode: service.code,
          serviceName: service.name,
          staffId: validStaffId,
          fifoOrder: true
        }),
        userId: validStaffId || 'system'
      }
    })

    // Emit Socket.IO event for real-time updates
    try {
      if (global.io) {
        const ticketData = {
          ticketId: updatedTicket.id,
          ticketNumber: updatedTicket.ticketNumber,
          serviceCode: updatedTicket.service.code,
          serviceName: updatedTicket.service.name,
          staffName: updatedTicket.staff?.name,
          calledAt: updatedTicket.calledAt,
          waitingTime
        }
        
        // Broadcast to display and staff rooms
        global.io.to('display-room').emit('ticket-called', ticketData)
        global.io.to('staff-room').emit('ticket-called', ticketData)
        global.io.to('admin-room').emit('ticket-called', ticketData)
        
        console.log('Socket.IO event emitted for next ticket called (FIFO):', ticketData)
      }
    } catch (socketError) {
      console.error('Error emitting Socket.IO event:', socketError)
    }

    return NextResponse.json({
      ticket: updatedTicket,
      message: `Next ticket ${updatedTicket.ticketNumber} called successfully (FIFO order)`
    })
  } catch (error) {
    console.error('Error calling next ticket:', error)
    return NextResponse.json(
      { error: 'Failed to call next ticket' },
      { status: 500 }
    )
  }
}

// GET endpoint to preview the next ticket without calling it
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Find the next ticket in FIFO order (oldest first)
    const nextTicket = await db.ticket.findFirst({
      where: {
        serviceId: serviceId,
        status: 'WAITING'
      },
      orderBy: {
        createdAt: 'asc' // FIFO: oldest ticket first
      },
      include: {
        service: true
      }
    })

    if (!nextTicket) {
      return NextResponse.json(
        { 
          message: 'No waiting tickets found for this service',
          nextTicket: null
        },
        { status: 200 }
      )
    }

    // Calculate current waiting time
    const currentWaitingTime = Math.floor(
      (new Date().getTime() - new Date(nextTicket.issuedAt).getTime()) / (1000 * 60)
    )

    // Count tickets ahead of this one
    const ticketsAhead = await db.ticket.count({
      where: {
        serviceId: serviceId,
        status: 'WAITING',
        createdAt: {
          lt: nextTicket.createdAt
        }
      }
    })

    return NextResponse.json({
      nextTicket: {
        ...nextTicket,
        currentWaitingTime,
        ticketsAhead
      },
      message: `Next ticket: ${nextTicket.ticketNumber} (Position: ${ticketsAhead + 1})`
    })
  } catch (error) {
    console.error('Error getting next ticket:', error)
    return NextResponse.json(
      { error: 'Failed to get next ticket' },
      { status: 500 }
    )
  }
}