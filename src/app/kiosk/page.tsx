'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, Printer, Home } from 'lucide-react'
import LanguageSelector from '@/components/LanguageSelector'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { Language, getTranslation, getLanguageDirection } from '@/lib/translations'

interface Service {
  id: string
  name: string
  code: string
  color: string
  description?: string
  nameAr?: string
  nameUr?: string
  nameBn?: string
  descriptionAr?: string
  descriptionUr?: string
  descriptionBn?: string
  isActive: boolean
  currentNumber: number
}

interface TicketData {
  id: string
  ticketNumber: string
  service: Service
  issuedAt: string
}

interface Settings {
  id: string
  institutionName: string
  logo: string | null
  showLogo: boolean
}

export default function KioskPage() {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [issuedTicket, setIssuedTicket] = useState<TicketData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en')

  useEffect(() => {
    fetchServices()
    fetchSettings()
  }, [])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      if (response.ok) {
        const data = await response.json()
        setServices(data.filter((service: Service) => service.isActive))
      }
    } catch (error) {
      console.error('Error fetching services:', error)
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

  const getServiceName = (service: Service): string => {
    switch (selectedLanguage) {
      case 'ar':
        return service.nameAr || service.name
      case 'ur':
        return service.nameUr || service.name
      case 'bn':
        return service.nameBn || service.name
      default:
        return service.name
    }
  }

  const getServiceDescription = (service: Service): string | undefined => {
    switch (selectedLanguage) {
      case 'ar':
        return service.descriptionAr || service.description
      case 'ur':
        return service.descriptionUr || service.description
      case 'bn':
        return service.descriptionBn || service.description
      default:
        return service.description
    }
  }

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language)
  }

  const handleServiceSelect = async (service: Service) => {
    setIsLoading(true)
    setSelectedService(service)

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id
        }),
      })

      if (response.ok) {
        const ticketData = await response.json()
        setIssuedTicket(ticketData)
        
        // Print the ticket if printer is available
        if (service.printerId) {
          await printTicket(ticketData)
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to issue ticket')
      }
    } catch (error) {
      console.error('Error issuing ticket:', error)
      alert('Failed to issue ticket')
    } finally {
      setIsLoading(false)
    }
  }

  const printTicket = async (ticket: TicketData) => {
    try {
      const response = await fetch('/api/tickets/print', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId: ticket.id
        }),
      })

      if (!response.ok) {
        console.error('Failed to print ticket')
      }
    } catch (error) {
      console.error('Error printing ticket:', error)
    }
  }

  const handlePrintTicket = () => {
    setIsPrinting(true)
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    
    if (!printWindow) {
      setIsPrinting(false)
      alert('Please allow popups for this website to print tickets')
      return
    }

    // Get the printable ticket HTML
    const ticketHtml = document.getElementById('printable-ticket')?.innerHTML
    
    if (!ticketHtml) {
      setIsPrinting(false)
      alert('Unable to generate ticket for printing')
      return
    }

    // Write the ticket HTML to the new window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Queue Ticket - ${issuedTicket?.service.code}${formatTicketNumber(issuedTicket?.ticketNumber || '')}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', monospace;
              background: white;
              padding: 0;
              margin: 0;
              display: block;
            }
            
            .ticket-container {
              width: 250px;
              background: white;
              border: 1px solid #333;
              padding: 12px;
              text-align: center;
              position: relative;
              font-family: 'Courier New', monospace;
              margin: 0;
            }
            
            .logo-container {
              margin-bottom: 8px;
            }
            
            .ticket-logo {
              width: 40px;
              height: 40px;
              object-fit: contain;
            }
            
            .ticket-header h2 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 6px;
              color: #333;
            }
            
            .divider {
              border-top: 1px dashed #333;
              margin: 6px 0;
            }
            
            .ticket-number {
              font-size: 32px;
              font-weight: bold;
              margin: 12px 0;
              color: #000;
              letter-spacing: 1px;
            }
            
            .ticket-service {
              font-size: 12px;
              font-weight: bold;
              margin: 8px 0;
              color: #333;
              text-transform: uppercase;
            }
            
            .ticket-details {
              margin: 12px 0;
              text-align: left;
            }
            
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin: 4px 0;
              font-size: 10px;
              color: #555;
            }
            
            .detail-row span:first-child {
              font-weight: bold;
            }
            
            .ticket-footer {
              margin-top: 12px;
            }
            
            .ticket-footer p {
              font-size: 9px;
              color: #666;
              margin: 3px 0;
            }
            
            .ticket-footer p.small {
              font-size: 8px;
              font-style: italic;
            }
            
            @media print {
              body {
                padding: 0;
                background: white;
                margin: 0;
                display: block;
              }
              
              .ticket-container {
                border: 1px solid #333;
                box-shadow: none;
                margin: 0;
                padding: 12px;
                width: 250px;
                height: auto;
                position: relative;
                top: 0;
                left: 0;
              }
              
              .ticket-logo {
                width: 40px;
                height: 40px;
              }
              
              @page {
                margin: 2mm 5mm 5mm 5mm;
                size: auto;
                width: 250px;
                height: auto;
              }
            }
          </style>
        </head>
        <body>
          ${ticketHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `)
    
    printWindow.document.close()
    
    // Reset printing state after a delay
    setTimeout(() => {
      setIsPrinting(false)
    }, 2000)
  }

  const resetKiosk = () => {
    setSelectedService(null)
    setIssuedTicket(null)
  }

  const formatTicketNumber = (ticketNumber: string) => {
    return ticketNumber.padStart(3, '0')
  }

  const direction = getLanguageDirection(selectedLanguage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir={direction}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {settings?.institutionName || getTranslation('kiosk.title', selectedLanguage)}
          </h1>
          <p className="text-lg text-gray-600">
            {getTranslation('kiosk.subtitle', selectedLanguage)}
          </p>
        </div>

        {/* Language Selector */}
        <LanguageSelector 
          selectedLanguage={selectedLanguage}
          onLanguageSelect={handleLanguageSelect}
        />

        {!selectedService && !issuedTicket && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card 
                key={service.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
                onClick={() => handleServiceSelect(service)}
                disabled={isLoading}
              >
                <CardHeader className="text-center pb-4">
                  <div 
                    className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: service.color }}
                  >
                    {service.code}
                  </div>
                  <CardTitle className="text-xl">{getServiceName(service)}</CardTitle>
                  {getServiceDescription(service) && (
                    <CardDescription className="text-sm">
                      {getServiceDescription(service)}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="text-center">
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-sm">
                      {getTranslation('kiosk.current', selectedLanguage)}: {formatTicketNumber(service.currentNumber.toString())}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {getTranslation('kiosk.click_to_get', selectedLanguage)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedService && !issuedTicket && (
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">
                  {getTranslation('kiosk.issuing_ticket', selectedLanguage)}
                </h3>
                <p className="text-gray-600">
                  {getTranslation('kiosk.please_wait', selectedLanguage)} {getServiceName(selectedService)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {issuedTicket && (
          <>
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-green-600">
                    {getTranslation('kiosk.ticket_issued', selectedLanguage)}
                  </CardTitle>
                  <CardDescription>
                    {getTranslation('kiosk.take_ticket', selectedLanguage)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-6xl font-bold text-gray-900 mb-2">
                      {issuedTicket.service.code}{formatTicketNumber(issuedTicket.ticketNumber)}
                    </div>
                    <div className="text-lg text-gray-600">
                      {getServiceName(issuedTicket.service)}
                    </div>
                    <div className="text-sm text-gray-500 mt-4">
                      Issued: {new Date(issuedTicket.issuedAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={() => handlePrintTicket()} 
                      className="w-full"
                      variant="outline"
                      disabled={isPrinting}
                    >
                      {isPrinting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          {getTranslation('kiosk.preparing_print', selectedLanguage)}
                        </>
                      ) : (
                        <>
                          <Printer className="h-4 w-4 mr-2" />
                          {getTranslation('kiosk.print_ticket', selectedLanguage)}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={resetKiosk} 
                      className="w-full"
                      disabled={isPrinting}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {getTranslation('kiosk.get_another', selectedLanguage)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Printable Ticket - Hidden from screen, visible when printing */}
            <div id="printable-ticket" className="print-only">
              <div className="ticket-container">
                <div className="ticket-header">
                  {/* Logo above title */}
                  <div className="logo-container">
                    {settings?.logo && settings.showLogo ? (
                      <ImageWithFallback 
                        src={settings.logo} 
                        alt="Logo" 
                        className="ticket-logo" 
                      />
                    ) : (
                      <ImageWithFallback 
                        src="/logo.svg" 
                        alt="Logo" 
                        className="ticket-logo" 
                      />
                    )}
                  </div>
                  <h2>{settings?.institutionName || getTranslation('kiosk.title', selectedLanguage)}</h2>
                  <div className="divider"></div>
                </div>
                
                <div className="ticket-body">
                  <div className="ticket-number">
                    {issuedTicket.service.code}{formatTicketNumber(issuedTicket.ticketNumber)}
                  </div>
                  
                  <div className="ticket-service">
                    {getServiceName(issuedTicket.service)}
                  </div>
                  
                  <div className="ticket-details">
                    <div className="detail-row">
                      <span>{getTranslation('ticket.service', selectedLanguage)}:</span>
                      <span>{issuedTicket.service.code}</span>
                    </div>
                    <div className="detail-row">
                      <span>{getTranslation('ticket.ticket', selectedLanguage)}:</span>
                      <span>#{formatTicketNumber(issuedTicket.ticketNumber)}</span>
                    </div>
                    <div className="detail-row">
                      <span>{getTranslation('ticket.date', selectedLanguage)}:</span>
                      <span>{new Date(issuedTicket.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-row">
                      <span>{getTranslation('ticket.time', selectedLanguage)}:</span>
                      <span>{new Date(issuedTicket.issuedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="ticket-footer">
                  <div className="divider"></div>
                  <p>{getTranslation('ticket.wait_message', selectedLanguage)}</p>
                  <p className="small">{getTranslation('ticket.thank_you', selectedLanguage)}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Back to Home Button */}
        <div className="fixed bottom-4 left-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            {getTranslation('kiosk.back_to_home', selectedLanguage)}
          </Button>
        </div>
      </div>
    </div>
  )
}