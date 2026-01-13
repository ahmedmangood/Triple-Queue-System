'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, TrendingUp, Users, Clock, Download, Calendar } from 'lucide-react'

interface ReportData {
  totalTickets: number
  servedTickets: number
  averageWaitTime: number
  serviceRates: Array<{
    serviceName: string
    tickets: number
    served: number
    averageWait: number
  }>
  staffPerformance: Array<{
    staffName: string
    ticketsServed: number
    averageTime: number
  }>
  dailyStats: Array<{
    date: string
    tickets: number
    served: number
  }>
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date()
  })
  const [reportType, setReportType] = useState('overview')

  useEffect(() => {
    fetchReportData()
  }, [dateRange, reportType])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        type: reportType
      })
      
      const response = await fetch(`/api/admin/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      } else {
        console.error('Failed to fetch report data')
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        type: reportType,
        export: 'true'
      })
      
      const response = await fetch(`/api/admin/reports?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `queue-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`
    }
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">
            Monitor queue performance and customer service metrics
          </p>
        </div>
        <Button onClick={exportReport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="services">By Service</SelectItem>
                  <SelectItem value="staff">By Staff</SelectItem>
                  <SelectItem value="daily">Daily Trends</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select 
                value="7days" 
                onValueChange={(value) => {
                  const days = parseInt(value.replace('days', ''))
                  setDateRange({
                    from: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                    to: new Date()
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1days">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.totalTickets}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.servedTickets} served
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.totalTickets > 0 
                    ? Math.round((reportData.servedTickets / reportData.totalTickets) * 100)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  of tickets served
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(reportData.averageWaitTime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  per customer
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.serviceRates.length}</div>
                <p className="text-xs text-muted-foreground">
                  services running
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList>
              <TabsTrigger value="services">Service Performance</TabsTrigger>
              <TabsTrigger value="staff">Staff Performance</TabsTrigger>
              <TabsTrigger value="trends">Daily Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <CardDescription>
                    Ticket volume and wait times by service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Total Tickets</TableHead>
                        <TableHead>Served</TableHead>
                        <TableHead>Service Rate</TableHead>
                        <TableHead>Avg Wait Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.serviceRates.map((service, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{service.serviceName}</TableCell>
                          <TableCell>{service.tickets}</TableCell>
                          <TableCell>{service.served}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {service.tickets > 0 
                                ? Math.round((service.served / service.tickets) * 100)
                                : 0}%
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDuration(service.averageWait)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance</CardTitle>
                  <CardDescription>
                    Individual staff member performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Staff Member</TableHead>
                        <TableHead>Tickets Served</TableHead>
                        <TableHead>Average Service Time</TableHead>
                        <TableHead>Efficiency</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.staffPerformance.map((staff, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{staff.staffName}</TableCell>
                          <TableCell>{staff.ticketsServed}</TableCell>
                          <TableCell>{formatDuration(staff.averageTime)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={staff.averageTime < 10 ? "default" : "secondary"}
                            >
                              {staff.averageTime < 10 ? "High" : "Normal"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Trends</CardTitle>
                  <CardDescription>
                    Ticket volume trends over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reportData.dailyStats.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">
                            {day.served} of {day.tickets} tickets served
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{day.tickets}</p>
                          <p className="text-sm text-gray-500">tickets</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}