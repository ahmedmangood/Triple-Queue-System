import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id

    // Find the ticket
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: { service: true }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    if (ticket.status !== 'CALLED') {
      return NextResponse.json(
        { error: 'Only called tickets can be recalled' },
        { status: 400 }
      )
    }

    // Update the ticket to mark it as recalled (update calledAt timestamp)
    const updatedTicket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        calledAt: new Date()
      },
      include: {
        service: true
      }
    })

    // Log the recall
    await db.auditLog.create({
      data: {
        action: 'RECALL',
        entity: 'ticket',
        entityId: ticketId,
        details: JSON.stringify({
          ticketNumber: ticket.ticketNumber,
          service: ticket.service.name,
          recalledAt: new Date().toISOString()
        })
      }
    })

    return NextResponse.json({
      message: 'Ticket recalled successfully',
      ticket: updatedTicket
    })
  } catch (error) {
    console.error('Error recalling ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}