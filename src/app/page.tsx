'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Settings, Monitor, Ticket } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface Settings {
  id: string
  institutionName: string
  logo: string | null
  showLogo: boolean
}

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            {settings?.logo && settings.showLogo ? (
              <ImageWithFallback 
                src={settings.logo} 
                alt="Logo" 
                className="w-16 h-16 object-contain" 
              />
            ) : (
              <ImageWithFallback 
                src="/logo.svg" 
                alt="Logo" 
                className="w-16 h-16" 
              />
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            {settings?.institutionName || 'Queue Management System'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Streamline your customer service with intelligent queue management and real-time ticket processing
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/admin">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Settings className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>
                  Manage services, staff, and system settings
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/kiosk">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Ticket className="h-12 w-12 mx-auto text-green-600 mb-2" />
                <CardTitle>Customer Kiosk</CardTitle>
                <CardDescription>
                  Issue tickets to customers
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/staff">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Users className="h-12 w-12 mx-auto text-purple-600 mb-2" />
                <CardTitle>Staff Portal</CardTitle>
                <CardDescription>
                  Manage and call tickets using FIFO order
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/display">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="text-center">
                <Monitor className="h-12 w-12 mx-auto text-orange-600 mb-2" />
                <CardTitle>Display Screen</CardTitle>
                <CardDescription>
                  Show current ticket numbers
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            System Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Service Management</h3>
              <p className="text-gray-600 text-sm">
                Create and manage multiple service types with custom colors and codes
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">FIFO Queue System</h3>
              <p className="text-gray-600 text-sm">
                First-In-First-Out logic ensures fair service order and optimal wait times
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics & Reports</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive reporting on wait times, service rates, and staff performance
              </p>
            </div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="text-center mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Getting Started
          </h2>
          <p className="text-gray-600 mb-6">
            Access the admin dashboard to configure your system and start managing queues
          </p>
          <Link href="/admin">
            <Button size="lg" className="px-8 py-3">
              Go to Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}