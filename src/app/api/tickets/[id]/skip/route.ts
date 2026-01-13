import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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

    if (ticket.status !== 'CALLED') {
      return NextResponse.json(
        { error: 'Ticket is not in called status' },
        { status: 400 }
      )
    }

    // Update the ticket
    const updatedTicket = await db.ticket.update({
      where: { id },
      data: {
        status: 'SKIPPED'
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
        action: 'SKIP',
        entity: 'ticket',
        entityId: ticket.id,
        details: JSON.stringify({ 
          ticketNumber: ticket.ticketNumber,
          serviceCode: ticket.service.code,
          staffId: ticket.staffId
        }),
        userId: ticket.staffId || 'system'
      }
    })

    // TODO: Emit WebSocket event for real-time display updates
    // This would be implemented with Socket.IO

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error('Error skipping ticket:', error)
    return NextResponse.json(
      { error: 'Failed to skip ticket' },
      { status: 500 }
    )
  }
}