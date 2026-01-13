import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Global Socket.IO instance will be set by the server
declare global {
  var io: any
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { staffId } = body

    // Get the ticket
    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        service: true
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    if (ticket.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Ticket is not in waiting status' },
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

    // Calculate waiting time
    const waitingTime = Math.floor(
      (new Date().getTime() - new Date(ticket.issuedAt).getTime()) / (1000 * 60)
    )

    // Update the ticket
    const updatedTicket = await db.ticket.update({
      where: { id },
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
        action: 'CALL',
        entity: 'ticket',
        entityId: ticket.id,
        details: JSON.stringify({ 
          ticketNumber: ticket.ticketNumber,
          serviceCode: ticket.service.code,
          staffId: validStaffId
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
        }
        
        // Broadcast to display and staff rooms
        global.io.to('display-room').emit('ticket-called', ticketData)
        global.io.to('staff-room').emit('ticket-called', ticketData)
        
        console.log('Socket.IO event emitted for ticket called:', ticketData)
      }
    } catch (socketError) {
      console.error('Error emitting Socket.IO event:', socketError)
    }

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error('Error calling ticket:', error)
    return NextResponse.json(
      { error: 'Failed to call ticket' },
      { status: 500 }
    )
  }
}