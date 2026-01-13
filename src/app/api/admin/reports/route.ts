import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type') || 'overview'
    const exportCsv = searchParams.get('export') === 'true'

    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const toDate = to ? new Date(to) : new Date()

    // Fetch all tickets in the date range
    const tickets = await db.ticket.findMany({
      where: {
        createdAt: {
          gte: fromDate,
          lte: toDate
        }
      },
      include: {
        service: {
          select: {
            name: true,
            code: true
          }
        },
        staff: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate overall metrics
    const totalTickets = tickets.length
    const servedTickets = tickets.filter(t => t.status === 'SERVED').length
    const averageWaitTime = tickets
      .filter(t => t.waitingTime)
      .reduce((sum, t) => sum + (t.waitingTime || 0), 0) / 
      tickets.filter(t => t.waitingTime).length || 0

    // Group by service
    const serviceMap = new Map()
    tickets.forEach(ticket => {
      const serviceName = ticket.service.name
      if (!serviceMap.has(serviceName)) {
        serviceMap.set(serviceName, {
          serviceName,
          tickets: 0,
          served: 0,
          totalWait: 0,
          waitCount: 0
        })
      }
      const service = serviceMap.get(serviceName)
      service.tickets++
      if (ticket.status === 'SERVED') {
        service.served++
      }
      if (ticket.waitingTime) {
        service.totalWait += ticket.waitingTime
        service.waitCount++
      }
    })

    const serviceRates = Array.from(serviceMap.values()).map(service => ({
      serviceName: service.serviceName,
      tickets: service.tickets,
      served: service.served,
      averageWait: service.waitCount > 0 ? service.totalWait / service.waitCount : 0
    }))

    // Group by staff
    const staffMap = new Map()
    tickets.forEach(ticket => {
      if (ticket.staff) {
        const staffName = ticket.staff.name
        if (!staffMap.has(staffName)) {
          staffMap.set(staffName, {
            staffName,
            ticketsServed: 0,
            totalTime: 0,
            timeCount: 0
          })
        }
        const staff = staffMap.get(staffName)
        if (ticket.status === 'SERVED') {
          staff.ticketsServed++
        }
        if (ticket.waitingTime) {
          staff.totalTime += ticket.waitingTime
          staff.timeCount++
        }
      }
    })

    const staffPerformance = Array.from(staffMap.values()).map(staff => ({
      staffName: staff.staffName,
      ticketsServed: staff.ticketsServed,
      averageTime: staff.timeCount > 0 ? staff.totalTime / staff.timeCount : 0
    }))

    // Group by day
    const dailyMap = new Map()
    tickets.forEach(ticket => {
      const date = ticket.createdAt.toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          tickets: 0,
          served: 0
        })
      }
      const day = dailyMap.get(date)
      day.tickets++
      if (ticket.status === 'SERVED') {
        day.served++
      }
    })

    const dailyStats = Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const reportData = {
      totalTickets,
      servedTickets,
      averageWaitTime: Math.round(averageWaitTime),
      serviceRates,
      staffPerformance,
      dailyStats,
      dateRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      }
    }

    // Handle CSV export
    if (exportCsv) {
      const csvHeaders = [
        'Date',
        'Ticket Number',
        'Service',
        'Staff',
        'Status',
        'Wait Time (minutes)',
        'Issued At',
        'Called At',
        'Served At'
      ]

      const csvRows = tickets.map(ticket => [
        ticket.createdAt.toISOString().split('T')[0],
        ticket.ticketNumber,
        ticket.service.name,
        ticket.staff?.name || 'Unassigned',
        ticket.status,
        ticket.waitingTime || '',
        ticket.createdAt.toISOString(),
        ticket.calledAt?.toISOString() || '',
        ticket.servedAt?.toISOString() || ''
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="queue-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}