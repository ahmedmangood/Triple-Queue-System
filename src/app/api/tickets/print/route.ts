import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId } = body

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      )
    }

    // Get the ticket with service and printer info
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        service: {
          include: {
            printer: true
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      )
    }

    if (!ticket.service.printer) {
      return NextResponse.json(
        { error: 'No printer configured for this service' },
        { status: 400 }
      )
    }

    // In a real implementation, this would send the print job to the printer
    // For now, we'll just log the print request
    console.log('Print request:', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      service: ticket.service.name,
      printer: ticket.service.printer.name,
      printerType: ticket.service.printer.type,
      printerAddress: ticket.service.printer.address
    })

    // Simulate print job
    const printJob = {
      id: `print_${Date.now()}`,
      ticketNumber: `${ticket.service.code}${ticket.ticketNumber.padStart(3, '0')}`,
      serviceName: ticket.service.name,
      issuedAt: ticket.issuedAt,
      printerName: ticket.service.printer.name,
      status: 'sent'
    }

    // Log the print action
    await db.auditLog.create({
      data: {
        action: 'PRINT',
        entity: 'ticket',
        entityId: ticket.id,
        details: JSON.stringify({ 
          ticketNumber: ticket.ticketNumber,
          printerName: ticket.service.printer.name,
          printJobId: printJob.id
        }),
        userId: 'kiosk' // System generated
      }
    })

    return NextResponse.json({ 
      message: 'Print job sent successfully',
      printJob
    })
  } catch (error) {
    console.error('Error printing ticket:', error)
    return NextResponse.json(
      { error: 'Failed to print ticket' },
      { status: 500 }
    )
  }
}