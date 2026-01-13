'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Volume2, ExternalLink } from 'lucide-react'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface Service {
  id: string
  name: string
  code: string
  color: string
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
}

interface DisplayData {
  currentTickets: Ticket[]
  waitingTickets: Ticket[]
  recentTickets: Ticket[]
  services: Service[]
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

export default function DisplayPage() {
  const [displayData, setDisplayData] = useState<DisplayData>({
    currentTickets: [],
    waitingTickets: [],
    recentTickets: [],
    services: []
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    fetchDisplayData()
    fetchSettings()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchDisplayData, (settings?.refreshInterval || 5) * 1000)
    return () => clearInterval(interval)
  }, [settings?.refreshInterval])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const fetchDisplayData = async () => {
    try {
      const [displayResponse, servicesResponse] = await Promise.all([
        fetch('/api/display'),
        fetch('/api/services')
      ])
      
      if (displayResponse.ok && servicesResponse.ok) {
        const displayData = await displayResponse.json()
        const servicesData = await servicesResponse.json()
        
        setDisplayData({
          ...displayData,
          services: servicesData.filter((service: Service) => service.isActive)
        })
      }
    } catch (error) {
      console.error('Error fetching display data:', error)
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
    const fontSize = settings?.fontSize || 'medium'
    
    const sizes = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
      xlarge: 'text-xl'
    }
    
    return sizes[fontSize as keyof typeof sizes] || sizes.medium
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

  const getTransitionClasses = () => {
    const transition = settings?.transitionEffect || 'fade'
    
    const transitions = {
      fade: 'transition-opacity duration-500',
      slide: 'transition-transform duration-500',
      zoom: 'transition-transform duration-500 scale-100',
      flip: 'transition-transform duration-500'
    }
    
    return transitions[transition as keyof typeof transitions] || transitions.fade
  }

  const getTicketsByService = (serviceId: string) => {
    const currentTicket = displayData.currentTickets.find(ticket => ticket.service.id === serviceId)
    const waitingTickets = displayData.waitingTickets.filter(ticket => ticket.service.id === serviceId)
    const recentTickets = displayData.recentTickets.filter(ticket => ticket.service.id === serviceId)
    
    return {
      current: currentTicket,
      waiting: waitingTickets.slice(0, 5), // Show max 5 waiting tickets
      recent: recentTickets.slice(0, 3) // Show max 3 recent tickets
    }
  }

  return (
    <div className={`min-h-screen ${getThemeClasses()} ${getFontSizeClasses()} ${getFontFamilyClasses()} p-6 relative overflow-hidden`}
         style={{
           backgroundImage: settings?.displayBgUrl ? `url(${settings.displayBgUrl})` : undefined,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
      {/* Overlay for background image */}
      {settings?.displayBgUrl && (
        <div className="absolute inset-0 bg-black/40 z-0"></div>
      )}
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {settings?.logo && settings.showLogo && (
              <ImageWithFallback 
                src={settings.logo} 
                alt="Logo" 
                className="w-12 h-12 object-contain" 
              />
            )}
            <h1 className="text-3xl md:text-4xl font-light tracking-wide">
              {settings?.institutionName || 'Queue Management System'}
            </h1>
          </div>
          <div className="text-lg opacity-80 font-light">
            {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
          </div>
        </header>

        {/* Advertisement Section */}
        {settings?.showAds && settings.adContent && (
          <div className="mb-8 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
              <div dangerouslySetInnerHTML={{ __html: settings.adContent }} />
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayData.services.map((service) => {
            const tickets = getTicketsByService(service.id)
            
            return (
              <div key={service.id} className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 ${getTransitionClasses()}`}>
                {/* Service Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: service.color }}
                    >
                      {service.code}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{service.name}</h2>
                      <p className="text-sm opacity-70">Service Counter</p>
                    </div>
                  </div>
                  <Link href={`/display/${service.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 p-2"
                      title="Open dedicated display"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                {/* Current Ticket */}
                <div className="bg-white/10 rounded-xl p-6 mb-4 text-center">
                  <div className="text-sm opacity-70 mb-2">Now Serving</div>
                  {tickets.current ? (
                    <div className="text-4xl md:text-5xl font-bold">
                      {formatTicketNumber(tickets.current.ticketNumber, service.code)}
                    </div>
                  ) : (
                    <div className="text-2xl opacity-50">No Queue</div>
                  )}
                  {tickets.current?.staff && (
                    <div className="text-sm opacity-70 mt-2">
                      Counter: {tickets.current.staff.name}
                    </div>
                  )}
                </div>

                {/* Waiting Queue */}
                {tickets.waiting.length > 0 && (
                  <div className="mb-4">
                    <div className="text-sm opacity-70 mb-2">Waiting</div>
                    <div className="space-y-1">
                      {tickets.waiting.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                          <span className="font-mono">
                            {formatTicketNumber(ticket.ticketNumber, service.code)}
                          </span>
                          <span className="text-xs opacity-60">
                            {new Date(ticket.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Service */}
                {tickets.recent.length > 0 && (
                  <div>
                    <div className="text-sm opacity-70 mb-2">Recently Served</div>
                    <div className="flex gap-2 flex-wrap">
                      {tickets.recent.map((ticket) => (
                        <span key={ticket.id} className="bg-green-500/20 text-green-300 px-2 py-1 rounded-lg text-sm">
                          {formatTicketNumber(ticket.ticketNumber, service.code)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Individual Service Displays Section */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold mb-2">Individual Service Displays</h2>
            <p className="text-lg opacity-80">Dedicated displays for each service - perfect for separate TV screens</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayData.services.map((service) => (
              <Link key={service.id} href={`/display/${service.id}`}>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: service.color }}
                      >
                        {service.code}
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-blue-200 transition-colors">
                          {service.name}
                        </h3>
                        <p className="text-xs opacity-60">Dedicated Display</p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="mt-3 text-xs opacity-60">
                    /display/{service.id}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="text-sm opacity-60 mb-4">
            Please wait for your number to be called • Thank you for your patience
          </div>
          <div className="flex justify-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = '/'}
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Home
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}