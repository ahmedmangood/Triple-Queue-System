import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get current date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Get total services count
    const totalServices = await db.service.count({
      where: { isActive: true }
    })

    // Get today's tickets
    const todayTickets = await db.ticket.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        service: true
      }
    })

    // Get yesterday's tickets for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayTickets = await db.ticket.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today
        }
      }
    })

    // Calculate average wait time for today
    const servedTickets = todayTickets.filter(ticket => 
      ticket.status === 'SERVED' && ticket.servedAt
    )
    
    let totalWaitTime = 0
    servedTickets.forEach(ticket => {
      if (ticket.issuedAt && ticket.servedAt) {
        const waitTime = ticket.servedAt.getTime() - ticket.issuedAt.getTime()
        totalWaitTime += waitTime
      }
    })
    
    const averageWaitTime = servedTickets.length > 0 
      ? Math.round(totalWaitTime / servedTickets.length / 1000 / 60) // Convert to minutes
      : 0

    // Get staff statistics
    const totalStaff = await db.staff.count({
      where: { isActive: true }
    })

    // Get active staff (staff who have handled tickets today)
    const activeStaffIds = await db.ticket.findMany({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        staffId: {
          not: null
        }
      },
      select: { staffId: true }
    })

    const activeStaffCount = new Set(activeStaffIds.map(s => s.staffId)).size

    // Get recent activity
    const recentTickets = await db.ticket.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        service: true,
        staff: {
          select: { name: true }
        }
      }
    })

    const recentActivity = recentTickets.map(ticket => ({
      id: ticket.id,
      action: ticket.status === 'WAITING' ? 'New ticket issued' : 
             ticket.status === 'CALLED' ? 'Ticket called' :
             ticket.status === 'SERVED' ? 'Ticket completed' : 
             ticket.status === 'SKIPPED' ? 'Ticket skipped' : 'Ticket cancelled',
      details: `${ticket.service.name} - Ticket ${ticket.service.code}${ticket.ticketNumber.padStart(3, '0')}`,
      time: formatRelativeTime(ticket.createdAt),
      type: 'ticket'
    }))

    // Get service status
    const services = await db.service.findMany({
      where: { isActive: true },
      include: {
        tickets: {
          where: {
            status: 'WAITING'
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const serviceStatus = services.map(service => ({
      id: service.id,
      name: service.name,
      code: service.code,
      waitingCount: service.tickets.length,
      status: 'Active'
    }))

    // Calculate percentage changes
    const ticketsChangePercentage = yesterdayTickets > 0 
      ? Math.round(((todayTickets.length - yesterdayTickets) / yesterdayTickets) * 100)
      : (todayTickets.length > 0 ? 100 : 0) // Show 100% increase if first day with tickets

    const stats = {
      activeServices: totalServices,
      totalTicketsToday: todayTickets.length,
      averageWaitTime: averageWaitTime,
      staffOnline: `${activeStaffCount}/${totalStaff}`,
      ticketsChangePercentage: ticketsChangePercentage,
      services: serviceStatus,
      recentActivity: recentActivity
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    
    // Return default empty stats on error
    const defaultStats = {
      activeServices: 0,
      totalTicketsToday: 0,
      averageWaitTime: 0,
      staffOnline: '0/0',
      ticketsChangePercentage: 0,
      services: [],
      recentActivity: []
    }
    
    return NextResponse.json(defaultStats)
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
}