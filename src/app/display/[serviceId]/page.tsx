'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Volume2, Monitor, Grid } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface Service {
  id: string
  name: string
  code: string
  color: string
  description?: string
}

interface Ticket {
  id: string
  ticketNumber: string
  service: Service
  status: 'WAITING' | 'CALLED' | 'SERVED' | 'SKIPPED' | 'CANCELLED'
  calledAt?: string
  staff?: {
    name: string
  }
  issuedAt: string
}

interface ServiceDisplayData {
  service: Service
  currentTicket: Ticket | null
  waitingTickets: Ticket[]
  recentTickets: Ticket[]
}

interface Settings {
  id: string
  institutionName: string
  logo: string | null
  showLogo: boolean
  displayTheme: string
  displayBgUrl: string
  showAds: boolean
  adContent: string
  transitionEffect: string
  fontSize: string
  fontFamily: string
  autoRefresh: boolean
  refreshInterval: number
}

export default function ServiceDisplayPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.serviceId as string
  
  const [displayData, setDisplayData] = useState<ServiceDisplayData | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [settings, setSettings] = useState<Settings | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (serviceId) {
      fetchServiceDisplayData()
      fetchSettings()
    }
  }, [serviceId])

  useEffect(() => {
    const interval = setInterval(fetchServiceDisplayData, (settings?.refreshInterval || 5) * 1000)
    return () => clearInterval(interval)
  }, [serviceId, settings?.refreshInterval])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchServiceDisplayData = async () => {
    try {
      const [displayResponse, servicesResponse] = await Promise.all([
        fetch('/api/display'),
        fetch('/api/services')
      ])
      
      if (displayResponse.ok && servicesResponse.ok) {
        const displayData = await displayResponse.json()
        const servicesData = await servicesResponse.json()
        
        const service = servicesData.find((s: Service) => s.id === serviceId)
        if (!service) {
          setError('Service not found')
          return
        }

        const currentTicket = displayData.currentTickets.find((ticket: Ticket) => ticket.service.id === serviceId)
        const waitingTickets = displayData.waitingTickets.filter((ticket: Ticket) => ticket.service.id === serviceId)
        const recentTickets = displayData.recentTickets.filter((ticket: Ticket) => ticket.service.id === serviceId)

        setDisplayData({
          service,
          currentTicket: currentTicket || null,
          waitingTickets: waitingTickets.slice(0, 10), // Show more tickets for individual display
          recentTickets: recentTickets.slice(0, 5)
        })
        setError(null)
      }
    } catch (error) {
      console.error('Error fetching service display data:', error)
      setError('Failed to load service data')
    }
  }

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

  const formatTicketNumber = (ticketNumber: string, code: string) => {
    return `${code}${ticketNumber.padStart(3, '0')}`
  }

  const playSound = () => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.play()
    } catch (error) {
      console.log('Audio play failed or no sound file available')
    }
  }

  const getThemeClasses = () => {
    const theme = settings?.displayTheme || 'default'
    
    const themes = {
      default: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white',
      dark: 'bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white',
      blue: 'bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white',
      green: 'bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white',
      purple: 'bg-gradient-to-br from-purple-800 via-purple-700 to-pink-600 text-white'
    }
    
    return themes[theme as keyof typeof themes] || themes.default
  }

  const getFontSizeClasses = () => {
    const fontSize = settings?.fontSize || 'large' // Default to larger for TV displays
    
    const sizes = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl'
    }
    
    return sizes[fontSize as keyof typeof sizes] || sizes.large
  }

  const getFontFamilyClasses = () => {
    const fontFamily = settings?.fontFamily || 'default'
    
    const families = {
      default: 'font-sans',
      serif: 'font-serif',
      mono: 'font-mono',
      modern: 'font-sans'
    }
    
    return families[fontFamily as keyof typeof families] || families.default
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-700 text-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Service Not Found</h1>
          <p className="text-xl mb-8">{error}</p>
          <div className="space-x-4">
            <Button onClick={() => router.push('/display')} variant="outline" className="text-white border-white hover:bg-white hover:text-red-900">
              <Grid className="h-4 w-4 mr-2" />
              All Services
            </Button>
            <Button onClick={() => router.push('/')} variant="outline" className="text-white border-white hover:bg-white hover:text-red-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!displayData || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading service display...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()} ${getFontSizeClasses()} ${getFontFamilyClasses()} p-8 relative overflow-hidden`}
         style={{
           backgroundImage: settings.displayBgUrl ? `url(${settings.displayBgUrl})` : undefined,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
      {/* Overlay for background image */}
      {settings.displayBgUrl && (
        <div className="absolute inset-0 bg-black/40 z-0"></div>
      )}
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-6 mb-6">
            {settings.logo && settings.showLogo && (
              <ImageWithFallback 
                src={settings.logo} 
                alt="Logo" 
                className="w-16 h-16 object-contain" 
              />
            )}
            <div>
              <h1 className="text-4xl md:text-6xl font-light tracking-wide">
                {settings.institutionName || 'Queue Management System'}
              </h1>
              <div className="text-2xl opacity-80 font-light mt-2">
                {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </header>

        {/* Advertisement Section */}
        {settings.showAds && settings.adContent && (
          <div className="mb-8 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-4">
              <div dangerouslySetInnerHTML={{ __html: settings.adContent }} />
            </div>
          </div>
        )}

        {/* Main Service Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Current Ticket - Large Display */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20 text-center">
              {/* Service Info */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl"
                  style={{ backgroundColor: displayData.service.color }}
                >
                  {displayData.service.code}
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-semibold">{displayData.service.name}</h2>
                  <p className="text-lg opacity-70">Service Counter</p>
                </div>
              </div>

              {/* Current Ticket Number */}
              <div className="bg-white/10 rounded-2xl p-8 mb-6">
                <div className="text-2xl opacity-80 mb-4">Now Serving</div>
                {displayData.currentTicket ? (
                  <>
                    <div className="text-6xl md:text-8xl font-bold mb-4">
                      {formatTicketNumber(displayData.currentTicket.ticketNumber, displayData.service.code)}
                    </div>
                    {displayData.currentTicket.staff && (
                      <div className="text-xl opacity-80">
                        Counter: {displayData.currentTicket.staff.name}
                      </div>
                    )}
                    <div className="text-lg opacity-60 mt-2">
                      Called: {displayData.currentTicket.calledAt ? 
                        new Date(displayData.currentTicket.calledAt).toLocaleTimeString() : 
                        'Just now'
                      }
                    </div>
                  </>
                ) : (
                  <div className="text-4xl md:text-5xl opacity-50">No Queue</div>
                )}
              </div>

              {displayData.currentTicket && (
                <Button
                  onClick={playSound}
                  variant="ghost"
                  size="lg"
                  className="text-white hover:bg-white/20"
                >
                  <Volume2 className="h-6 w-6 mr-3" />
                  Play Sound
                </Button>
              )}
            </div>
          </div>

          {/* Waiting Queue */}
          <div>
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <h3 className="text-2xl font-semibold mb-6 text-center">Waiting Queue</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {displayData.waitingTickets.length > 0 ? (
                  displayData.waitingTickets.map((ticket) => (
                    <div key={ticket.id} className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                      <span className="text-2xl font-mono font-semibold">
                        {formatTicketNumber(ticket.ticketNumber, displayData.service.code)}
                      </span>
                      <span className="text-sm opacity-70">
                        {new Date(ticket.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 opacity-60">
                    No tickets waiting
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recently Served */}
        {displayData.recentTickets.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl font-semibold mb-6 text-center">Recently Served</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {displayData.recentTickets.map((ticket) => (
                <div key={ticket.id} className="bg-green-500/20 text-green-300 px-6 py-3 rounded-xl text-2xl font-mono">
                  {formatTicketNumber(ticket.ticketNumber, displayData.service.code)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <footer className="mt-12 text-center">
          <div className="text-lg opacity-60 mb-6">
            Please wait for your number to be called • Thank you for your patience
          </div>
          <div className="flex justify-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/display')}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <Grid className="h-5 w-5 mr-2" />
              All Services
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Home
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}