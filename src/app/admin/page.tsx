'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Ticket, Clock, TrendingUp, Plus, Settings, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  activeServices: number
  totalTicketsToday: number
  averageWaitTime: number
  staffOnline: string
  ticketsChangePercentage: number
  services: Array<{
    id: string
    name: string
    code: string
    waitingCount: number
    status: string
  }>
  recentActivity: Array<{
    id: string
    action: string
    details: string
    time: string
    type: string
  }>
}

export default function AdminOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        throw new Error('Failed to fetch dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
      // Set default empty stats to prevent UI crashes
      setStats({
        activeServices: 0,
        totalTicketsToday: 0,
        averageWaitTime: 0,
        staffOnline: '0/0',
        ticketsChangePercentage: 0,
        services: [],
        recentActivity: []
      })
    } finally {
      setLoading(false)
    }
  }

  const statsData = [
    {
      title: 'Active Services',
      value: stats?.activeServices?.toString() || '0',
      change: 'Services running',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Total Tickets Today',
      value: stats?.totalTicketsToday?.toString() || '0',
      change: `${stats?.ticketsChangePercentage > 0 ? '+' : ''}${stats?.ticketsChangePercentage || 0}% from yesterday`,
      icon: Ticket,
      color: 'text-green-600',
    },
    {
      title: 'Average Wait Time',
      value: `${stats?.averageWaitTime || 0} min`,
      change: 'Real-time calculation',
      icon: Clock,
      color: 'text-orange-600',
    },
    {
      title: 'Staff Online',
      value: stats?.staffOnline || '0/0',
      change: 'Currently active',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
  ]

  const quickActions = [
    {
      title: 'Add New Service',
      description: 'Create a new service for customers',
      icon: Plus,
      href: '/admin/services',
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Staff',
      description: 'Add or edit staff members',
      icon: Users,
      href: '/admin/staff',
      color: 'bg-green-500',
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-purple-500',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Dashboard</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Button onClick={fetchDashboardData} className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </Button>
              <div className="text-sm text-gray-500">
                If the problem persists, the database might be empty. Try setting up your system first.
              </div>
            </div>
          </div>
        </div>
        
        {/* Show quick actions even in error state */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/services">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-blue-500">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Add Services</h3>
                      <p className="text-sm text-gray-500">Create services for customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/staff">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-green-500">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Manage Staff</h3>
                      <p className="text-sm text-gray-500">Add staff members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/admin/settings">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-purple-500">
                      <Settings className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Settings</h3>
                      <p className="text-sm text-gray-500">Configure system</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your queue management system today.
          </p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Empty State */}
      {stats && stats.activeServices === 0 && stats.totalTicketsToday === 0 && (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Your queue management system is ready! Start by adding services and staff members to begin managing tickets.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/admin/services">
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Service
                </Button>
              </Link>
              <Link href="/admin/staff">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Users className="w-4 h-4 mr-2" />
                  Add Staff Members
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{action.title}</h3>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </p>
                      <p className="text-sm text-gray-500">{activity.details}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Activity will appear here once tickets are created</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Current status of all services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.services?.length > 0 ? (
                stats.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-xs text-gray-500">
                        {service.waitingCount} waiting
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {service.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">No active services</p>
                  <p className="text-xs text-gray-400 mt-1">
                    <Link href="/admin/services" className="text-blue-600 hover:text-blue-800">
                      Add your first service
                    </Link> to get started
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}