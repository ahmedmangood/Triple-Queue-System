import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, targetServiceId, staffId } = body

    if (!ticketId || !targetServiceId) {
      return NextResponse.json(
        { error: 'Ticket ID and target service ID are required' },
        { status: 400 }
      )
    }

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

    if (ticket.status !== 'WAITING') {
      return NextResponse.json(
        { error: 'Only waiting tickets can be transferred' },
        { status: 400 }
      )
    }

    // Find the target service
    const targetService = await db.service.findUnique({
      where: { id: targetServiceId }
    })

    if (!targetService) {
      return NextResponse.json(
        { error: 'Target service not found' },
        { status: 404 }
      )
    }

    // Update the ticket's service
    const updatedTicket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        serviceId: targetServiceId,
        // Update the ticket number to match the new service's numbering
        ticketNumber: await generateNewTicketNumber(targetServiceId)
      },
      include: {
        service: true
      }
    })

    // Log the transfer
    await db.auditLog.create({
      data: {
        action: 'TRANSFER',
        entity: 'ticket',
        entityId: ticketId,
        details: JSON.stringify({
          fromService: ticket.service.name,
          toService: targetService.name,
          oldTicketNumber: ticket.ticketNumber,
          newTicketNumber: updatedTicket.ticketNumber,
          staffId
        }),
        userId: staffId
      }
    })

    return NextResponse.json({
      message: 'Ticket transferred successfully',
      ticket: updatedTicket
    })
  } catch (error) {
    console.error('Error transferring ticket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateNewTicketNumber(serviceId: string): Promise<string> {
  // Get the current ticket number for the service
  const service = await db.service.findUnique({
    where: { id: serviceId }
  })

  if (!service) {
    throw new Error('Service not found')
  }

  // Increment the current number
  const newNumber = service.currentNumber + 1

  // Update the service's current number
  await db.service.update({
    where: { id: serviceId },
    data: { currentNumber: newNumber }
  })

  return newNumber.toString()
}