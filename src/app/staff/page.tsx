'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, SkipForward, CheckCircle, XCircle, Users, Clock, ArrowLeft, Volume2, VolumeX, LogOut, ArrowRight, RefreshCw, Phone } from 'lucide-react'
import { beepAudioData } from '@/lib/audio'
import { audioAnnouncementService, AnnouncementData } from '@/lib/audio-announcements'
import { Input } from '@/components/ui/input'

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
  issuedAt: string
  calledAt?: string
  servedAt?: string
  waitingTime?: number
}

interface StaffData {
  id: string
  name: string
  email: string
  username: string
  role: string
  counterNumber?: number
  services: Service[]
}

export default function StaffPage() {
  const [staffData, setStaffData] = useState<StaffData | null>(null)
  const [waitingTickets, setWaitingTickets] = useState<Ticket[]>([])
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null)
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCallDialog, setShowCallDialog] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioInitialized, setAudioInitialized] = useState(false)
  const [showAudioInitButton, setShowAudioInitButton] = useState(false)
  const [showVisualNotification, setShowVisualNotification] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  
  // New state variables for additional functionality
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferTicketId, setTransferTicketId] = useState<string>('')
  const [targetServiceId, setTargetServiceId] = useState<string>('')
  const [ticketNumberInput, setTicketNumberInput] = useState<string>('')
  const [showCallDialog2, setShowCallDialog2] = useState(false)
  const [allServices, setAllServices] = useState<Service[]>([])
  const [allTickets, setAllTickets] = useState<Ticket[]>([])

  useEffect(() => {
    // Fetch authenticated staff data
    const fetchStaffData = async () => {
      try {
        const response = await fetch('/api/staff/me')
        if (response.ok) {
          const staff = await response.json()
          setStaffData(staff)
        } else if (response.status === 401) {
          // Redirect to login if not authenticated
          window.location.href = '/staff/login'
        }
      } catch (error) {
        console.error('Error fetching staff data:', error)
        // Redirect to login on error
        window.location.href = '/staff/login'
      }
    }

    fetchStaffData()
  }, [])

  useEffect(() => {
    if (staffData) {
      fetchTickets()
    }
  }, [staffData])

  useEffect(() => {
    // Fetch all services and tickets for transfer functionality
    const fetchAllData = async () => {
      try {
        const [servicesResponse, ticketsResponse] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/tickets')
        ])
        
        if (servicesResponse.ok) {
          const services = await servicesResponse.json()
          setAllServices(services)
        }
        
        if (ticketsResponse.ok) {
          const tickets = await ticketsResponse.json()
          setAllTickets(tickets)
        }
      } catch (error) {
        console.error('Error fetching all data:', error)
      }
    }
    
    fetchAllData()
  }, [])

  useEffect(() => {
    // Initialize audio system
    const initializeAudio = async () => {
      try {
        console.log('Initializing audio system...')
        await audioAnnouncementService.preloadVoices()
        
        // Check if ready
        const isReady = await audioAnnouncementService.isReady()
        console.log('Audio system ready:', isReady)
        
        if (isReady) {
          setAudioInitialized(true)
        } else {
          console.warn('Audio system not fully ready, showing init button')
          setShowAudioInitButton(true)
        }
      } catch (error) {
        console.error('Error initializing audio system:', error)
        setShowAudioInitButton(true)
      }
    }

    initializeAudio()
  }, [])

  const fetchTickets = async () => {
    if (!staffData?.services || staffData.services.length === 0) return
    
    try {
      // Get all service IDs for this staff member
      const serviceIds = staffData.services.map(s => s.service.id).join(',')
      const response = await fetch(`/api/tickets?serviceIds=${serviceIds}`)
      if (response.ok) {
        const data = await response.json()
        const waiting = data.filter((ticket: Ticket) => ticket.status === 'WAITING')
        const recent = data.filter((ticket: Ticket) => 
          ['CALLED', 'SERVED', 'SKIPPED'].includes(ticket.status)
        ).slice(0, 10)
        
        setWaitingTickets(waiting)
        setRecentTickets(recent)
        
        // Find current ticket (the one that was called but not served)
        const current = data.find((ticket: Ticket) => ticket.status === 'CALLED')
        setCurrentTicket(current || null)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const callNextTicket = async () => {
    if (!staffData?.services || staffData.services.length === 0) {
      alert('No services assigned to you')
      return
    }

    setIsLoading(true)
    try {
      // Use the first assigned service for FIFO call
      const serviceId = staffData.services[0].service.id
      
      const response = await fetch('/api/queue/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: serviceId,
          staffId: staffData.id || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentTicket(result.ticket)
        setShowCallDialog(true)
        await fetchTickets()
        
        // Play sound notification
        await playNotificationSound()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to call next ticket')
      }
    } catch (error) {
      console.error('Error calling next ticket:', error)
      alert('Failed to call next ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const serveTicket = async () => {
    if (!currentTicket) return

    try {
      const response = await fetch(`/api/tickets/${currentTicket.id}/serve`, {
        method: 'POST',
      })

      if (response.ok) {
        setCurrentTicket(null)
        await fetchTickets()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to serve ticket')
      }
    } catch (error) {
      console.error('Error serving ticket:', error)
      alert('Failed to serve ticket')
    }
  }

  const skipTicket = async () => {
    if (!currentTicket) return

    try {
      const response = await fetch(`/api/tickets/${currentTicket.id}/skip`, {
        method: 'POST',
      })

      if (response.ok) {
        setCurrentTicket(null)
        await fetchTickets()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to skip ticket')
      }
    } catch (error) {
      console.error('Error skipping ticket:', error)
      alert('Failed to skip ticket')
    }
  }

  // New functions for additional functionality
  const transferTicket = async () => {
    if (!transferTicketId || !targetServiceId) {
      alert('Please select both a ticket and target service')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/tickets/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: transferTicketId,
          targetServiceId: targetServiceId,
          staffId: staffData?.id || null
        }),
      })

      if (response.ok) {
        setShowTransferDialog(false)
        setTransferTicketId('')
        setTargetServiceId('')
        await fetchTickets()
        alert('Ticket transferred successfully')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to transfer ticket')
      }
    } catch (error) {
      console.error('Error transferring ticket:', error)
      alert('Failed to transfer ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const callSpecificTicket = async () => {
    if (!ticketNumberInput.trim()) {
      alert('Please enter a ticket number')
      return
    }

    if (!staffData?.services || staffData.services.length === 0) {
      alert('No services assigned to you')
      return
    }

    setIsLoading(true)
    try {
      // Find the ticket by number across all staff services
      const ticket = allTickets.find(t => 
        t.ticketNumber === ticketNumberInput.trim() && 
        staffData.services.some(s => s.service.id === t.service.id) &&
        t.status === 'WAITING'
      )

      if (!ticket) {
        alert('Ticket not found or not in waiting status')
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/tickets/${ticket.id}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staffId: staffData?.id || null
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentTicket(result.ticket)
        setShowCallDialog2(true)
        setTicketNumberInput('')
        await fetchTickets()
        await playNotificationSound()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to call ticket')
      }
    } catch (error) {
      console.error('Error calling specific ticket:', error)
      alert('Failed to call ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const recallTicket = async () => {
    if (!currentTicket) {
      alert('No current ticket to recall')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/tickets/${currentTicket.id}/recall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setShowCallDialog2(true)
        await playNotificationSound()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to recall ticket')
      }
    } catch (error) {
      console.error('Error recalling ticket:', error)
      alert('Failed to recall ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const playNotificationSound = async () => {
    if (!audioEnabled) return
    
    try {
      // Try multiple audio methods with fallbacks
      let audioPlayed = false
      
      // Method 1: Try voice announcement first
      if (!audioPlayed && currentTicket) {
        try {
          await playVoiceAnnouncement()
          audioPlayed = true
          console.log('Voice announcement played successfully')
        } catch (error) {
          console.log('Voice announcement failed:', error)
        }
      }
      
      // Method 2: Try Web Audio API synthesis (most reliable)
      if (!audioPlayed) {
        try {
          await playWebAudioSynthesis()
          audioPlayed = true
          console.log('Web Audio API synthesis played successfully')
        } catch (error) {
          console.log('Web Audio API synthesis failed:', error)
        }
      }
      
      // Method 3: Try data URI audio (embedded)
      if (!audioPlayed) {
        try {
          await playDataURIAudio()
          audioPlayed = true
          console.log('Data URI audio played successfully')
        } catch (error) {
          console.log('Data URI audio failed:', error)
        }
      }
      
      // Method 4: Try traditional audio file
      if (!audioPlayed) {
        try {
          const audio = new Audio('/notification.mp3')
          audio.volume = 0.8
          await audio.play()
          audioPlayed = true
          console.log('Traditional audio played successfully')
        } catch (error) {
          console.log('Traditional audio failed:', error)
        }
      }
      
      if (!audioPlayed) {
        console.log('All audio methods failed, showing visual notification')
        // Show visual notification as final fallback
        setShowVisualNotification(true)
        setTimeout(() => setShowVisualNotification(false), 3000)
      }
      
    } catch (error) {
      console.error('All audio methods failed:', error)
      // Always show visual notification as fallback
      setShowVisualNotification(true)
      setTimeout(() => setShowVisualNotification(false), 3000)
    }
  }

  const playVoiceAnnouncement = async () => {
    if (!currentTicket || !staffData) return

    try {
      console.log('Starting voice announcement...')
      
      // Ensure audio system is ready
      const isReady = await audioAnnouncementService.isReady()
      if (!isReady) {
        console.warn('Audio system not ready, attempting to reinitialize...')
        await audioAnnouncementService.preloadVoices()
      }

      const counterNumber = staffData.counterNumber || 1 // Default to counter 1 if not assigned
      
      const announcementData: AnnouncementData = {
        ticketNumber: currentTicket.ticketNumber,
        serviceCode: currentTicket.service.code,
        serviceName: currentTicket.service.name,
        serviceNameAr: currentTicket.service.nameAr || undefined,
        counterNumber: counterNumber,
        staffName: staffData.name
      }

      console.log('Playing announcement with data:', announcementData)
      await audioAnnouncementService.playAnnouncement(announcementData)
      console.log('Voice announcement completed')
      
    } catch (error) {
      console.error('Error in voice announcement:', error)
      // Show visual notification as fallback
      setShowVisualNotification(true)
      setTimeout(() => setShowVisualNotification(false), 3000)
    }
  }
  
  const playWebAudioSynthesis = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    const audioContext = audioContextRef.current
    const currentTime = audioContext.currentTime
    
    // Create a more pleasant and attention-grabbing notification sound
    // This mimics a typical "ding-dong" sound
    const notes = [
      { frequency: 523.25, duration: 0.15, delay: 0 },     // C5
      { frequency: 659.25, duration: 0.15, delay: 0.2 },   // E5  
      { frequency: 783.99, duration: 0.3, delay: 0.4 }     // G5 (longer)
    ]
    
    notes.forEach(({ frequency, duration, delay }) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.setValueAtTime(frequency, currentTime + delay)
      oscillator.type = 'sine'
      
      // Better envelope for each note
      const startTime = currentTime + delay
      const attackTime = 0.01
      const decayTime = 0.05
      const sustainLevel = 0.3
      const releaseTime = duration - attackTime - decayTime
      
      // Attack
      gainNode.gain.setValueAtTime(0, startTime)
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + attackTime)
      
      // Decay to sustain
      gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime)
      
      // Release
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + duration)
    })
    
    // Return a promise that resolves when the sound finishes
    return new Promise((resolve) => {
      setTimeout(resolve, 1000)
    })
  }
  
  const playDataURIAudio = async () => {
    // Use the generated beep audio data
    const audio = new Audio(beepAudioData)
    audio.volume = 0.8
    await audio.play()
  }

  const testAudio = async () => {
    console.log('Testing audio system...')
    await playNotificationSound()
  }

  const testVoiceAnnouncement = async () => {
    console.log('Testing voice announcement system...')
    await playVoiceAnnouncement()
  }

  const testAudioSystem = async () => {
    console.log('Testing complete audio system...')
    
    try {
      // Test basic speech synthesis
      const isReady = await audioAnnouncementService.isReady()
      console.log('Audio system ready status:', isReady)
      
      if (!isReady) {
        await audioAnnouncementService.preloadVoices()
      }
      
      // Test with sample data
      const testData: AnnouncementData = {
        ticketNumber: '001',
        serviceCode: 'A',
        serviceName: 'Test Service',
        counterNumber: 1,
        staffName: staffData?.name || 'Test Staff'
      }
      
      await audioAnnouncementService.playAnnouncement(testData)
      console.log('Audio system test completed successfully')
      
    } catch (error) {
      console.error('Audio system test failed:', error)
      alert('Audio system test failed. Please check browser console for details.')
    }
  }

  const initializeAudioWithUserInteraction = async () => {
    try {
      console.log('Initializing audio with user interaction...')
      
      // Create a silent audio context to satisfy browser requirements
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      
      // Initialize speech synthesis
      await audioAnnouncementService.preloadVoices()
      
      // Test with a simple utterance to ensure speech synthesis works
      const testUtterance = new SpeechSynthesisUtterance('Audio system initialized')
      testUtterance.volume = 0.1
      speechSynthesis.speak(testUtterance)
      
      setAudioInitialized(true)
      setShowAudioInitButton(false)
      
      console.log('Audio system successfully initialized with user interaction')
      
    } catch (error) {
      console.error('Error initializing audio with user interaction:', error)
      alert('Failed to initialize audio system. Please check browser permissions.')
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/staff/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        // Redirect to login page after successful logout
        window.location.href = '/staff/login'
      } else {
        console.error('Logout failed')
        // Still redirect to login page even if logout fails
        window.location.href = '/staff/login'
      }
    } catch (error) {
      console.error('Error during logout:', error)
      // Still redirect to login page even if there's an error
      window.location.href = '/staff/login'
    }
  }

  const formatTicketNumber = (ticketNumber: string, code: string) => {
    return `${code}${ticketNumber.padStart(3, '0')}`
  }

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="secondary">Waiting</Badge>
      case 'CALLED':
        return <Badge className="bg-blue-100 text-blue-800">Called</Badge>
      case 'SERVED':
        return <Badge className="bg-green-100 text-green-800">Served</Badge>
      case 'SKIPPED':
        return <Badge className="bg-orange-100 text-orange-800">Skipped</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!staffData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Portal</h1>
            <p className="text-gray-600">
              Welcome, {staffData.name} 
              {staffData.counterNumber && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  Counter {staffData.counterNumber}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {showAudioInitButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={initializeAudioWithUserInteraction}
                className="flex items-center gap-2 text-xs bg-orange-50 hover:bg-orange-100 border-orange-200"
              >
                <Volume2 className="h-3 w-3" />
                Enable Audio
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={testAudio}
              className="flex items-center gap-2 text-xs"
            >
              Test Sound
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testVoiceAnnouncement}
              className="flex items-center gap-2 text-xs"
              disabled={!currentTicket}
            >
              Test Voice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testAudioSystem}
              className="flex items-center gap-2 text-xs bg-green-50 hover:bg-green-100"
            >
              Test Full Audio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="flex items-center gap-2"
            >
              {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {audioEnabled ? 'Sound On' : 'Sound Off'}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>

        {/* Visual Notification */}
        {showVisualNotification && (
          <div className="fixed top-4 right-4 z-50 animate-pulse">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
              <Volume2 className="h-6 w-6" />
              <div>
                <div className="font-semibold">Customer Called!</div>
                <div className="text-sm opacity-90">Please check the counter</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Ticket */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Current Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentTicket ? (
                <div className="text-center space-y-6">
                  <div className="bg-white border-2 border-primary rounded-lg p-8">
                    <div className="text-6xl font-bold text-primary mb-2">
                      {formatTicketNumber(currentTicket.ticketNumber, currentTicket.service.code)}
                    </div>
                    <div className="text-lg text-gray-600">
                      {currentTicket.service.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Called at: {currentTicket.calledAt ? new Date(currentTicket.calledAt).toLocaleTimeString() : 'Just now'}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button onClick={serveTicket} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Serve
                    </Button>
                    <Button onClick={skipTicket} variant="outline">
                      <SkipForward className="h-4 w-4 mr-2" />
                      Skip
                    </Button>
                    <Button onClick={recallTicket} variant="outline" disabled={isLoading}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Recall
                    </Button>
                    <Button onClick={() => setShowTransferDialog(true)} variant="outline" disabled={isLoading}>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Transfer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Users className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Current Ticket
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {waitingTickets.length > 0 
                      ? 'Click "Call Next (FIFO)" to call the next ticket in order'
                      : 'No tickets waiting in queue'
                    }
                  </p>
                  
                  {/* Type Number Section */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Call Specific Ticket</h4>
                    <div className="flex gap-2 justify-center">
                      <Input
                        type="text"
                        placeholder="Enter ticket number"
                        value={ticketNumberInput}
                        onChange={(e) => setTicketNumberInput(e.target.value)}
                        className="w-32"
                        disabled={isLoading}
                      />
                      <Button 
                        onClick={callSpecificTicket}
                        disabled={isLoading || !ticketNumberInput.trim()}
                        variant="outline"
                        size="sm"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button 
                      onClick={callNextTicket}
                      disabled={waitingTickets.length === 0 || isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Call Next (FIFO)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Queue Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Waiting</span>
                  <Badge variant="secondary">{waitingTickets.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Currently Serving</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {currentTicket ? 1 : 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Today</span>
                  <Badge variant="outline">{recentTickets.length}</Badge>
                </div>
              </div>

              {waitingTickets.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Next in Queue (FIFO Order)</h4>
                  <div className="space-y-2">
                    {waitingTickets.slice(0, 3).map((ticket, index) => (
                      <div key={ticket.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
                            {index + 1}
                          </span>
                          <span className="font-mono">
                            {formatTicketNumber(ticket.ticketNumber, ticket.service.code)}
                          </span>
                        </div>
                        <span className="text-gray-500">
                          {new Date(ticket.issuedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {waitingTickets.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{waitingTickets.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Recently processed tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket Number</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono">
                      {formatTicketNumber(ticket.ticketNumber, ticket.service.code)}
                    </TableCell>
                    <TableCell>{ticket.service.name}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      {ticket.servedAt 
                        ? new Date(ticket.servedAt).toLocaleTimeString()
                        : ticket.calledAt 
                        ? new Date(ticket.calledAt).toLocaleTimeString()
                        : new Date(ticket.issuedAt).toLocaleTimeString()
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calling Ticket</DialogTitle>
            <DialogDescription>
              Please announce the ticket number to the waiting customers
            </DialogDescription>
          </DialogHeader>
          {currentTicket && (
            <div className="text-center py-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatTicketNumber(currentTicket.ticketNumber, currentTicket.service.code)}
              </div>
              <div className="text-lg text-gray-600">
                {currentTicket.service.name}
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <Button onClick={() => setShowCallDialog(false)}>
              Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Second Call Dialog */}
      <Dialog open={showCallDialog2} onOpenChange={setShowCallDialog2}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calling Ticket</DialogTitle>
            <DialogDescription>
              Please announce the ticket number to the waiting customers
            </DialogDescription>
          </DialogHeader>
          {currentTicket && (
            <div className="text-center py-6">
              <div className="text-4xl font-bold text-primary mb-2">
                {formatTicketNumber(currentTicket.ticketNumber, currentTicket.service.code)}
              </div>
              <div className="text-lg text-gray-600">
                {currentTicket.service.name}
              </div>
            </div>
          )}
          <div className="flex justify-center">
            <Button onClick={() => setShowCallDialog2(false)}>
              Acknowledge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Ticket</DialogTitle>
            <DialogDescription>
              Select a ticket and target service to transfer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Ticket</label>
              <Select value={transferTicketId} onValueChange={setTransferTicketId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a ticket to transfer" />
                </SelectTrigger>
                <SelectContent>
                  {allTickets
                    .filter(ticket => ticket.status === 'WAITING')
                    .map((ticket) => (
                      <SelectItem key={ticket.id} value={ticket.id}>
                        {formatTicketNumber(ticket.ticketNumber, ticket.service.code)} - {ticket.service.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Target Service</label>
              <Select value={targetServiceId} onValueChange={setTargetServiceId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose target service" />
                </SelectTrigger>
                <SelectContent>
                  {allServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: service.color }}
                        />
                        {service.name} ({service.code})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={transferTicket} 
              disabled={!transferTicketId || !targetServiceId || isLoading}
            >
              {isLoading ? 'Transferring...' : 'Transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}