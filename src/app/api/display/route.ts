import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get current tickets (being called)
    const currentTickets = await db.ticket.findMany({
      where: {
        status: 'CALLED'
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
      },
      orderBy: {
        calledAt: 'desc'
      }
    })

    // Get waiting tickets - FIFO order (oldest first)
    const waitingTickets = await db.ticket.findMany({
      where: {
        status: 'WAITING'
      },
      include: {
        service: true
      },
      orderBy: {
        createdAt: 'asc' // FIFO: oldest ticket first
      },
      take: 20 // Limit to first 20 waiting tickets
    })

    // Get recently served tickets
    const recentTickets = await db.ticket.findMany({
      where: {
        status: 'SERVED'
      },
      include: {
        service: true
      },
      orderBy: {
        servedAt: 'desc'
      },
      take: 10 // Last 10 served tickets
    })

    return NextResponse.json({
      currentTickets,
      waitingTickets,
      recentTickets
    })
  } catch (error) {
    console.error('Error fetching display data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch display data' },
      { status: 500 }
    )
  }
}