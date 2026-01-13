'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { TicketCalledEvent, TicketServedEvent, TicketCreatedEvent } from '@/lib/socket'

export const useSocket = (room?: string) => {
  const [isConnected, setIsConnected] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })

    socketRef.current = socketInstance
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
      
      // Join room if specified
      if (room) {
        socketInstance.emit('join-room', room)
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setIsConnected(false)
    })

    return () => {
      if (room && socketInstance) {
        socketInstance.emit('leave-room', room)
      }
      socketInstance.disconnect()
    }
  }, [room])

  // Join/leave room functions
  const joinRoom = (newRoom: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', newRoom)
    }
  }

  const leaveRoom = (roomToLeave: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomToLeave)
    }
  }

  // Event emitters
  const emitTicketCalled = (data: TicketCalledEvent) => {
    if (socketRef.current) {
      socketRef.current.emit('ticket-called', data)
    }
  }

  const emitTicketServed = (data: TicketServedEvent) => {
    if (socketRef.current) {
      socketRef.current.emit('ticket-served', data)
    }
  }

  const emitTicketCreated = (data: TicketCreatedEvent) => {
    if (socketRef.current) {
      socketRef.current.emit('ticket-created', data)
    }
  }

  const emitDisplaySettingsUpdated = (data: any) => {
    if (socketRef.current) {
      socketRef.current.emit('display-settings-updated', data)
    }
  }

  const emitSoundSettingsUpdated = (data: any) => {
    if (socketRef.current) {
      socketRef.current.emit('sound-settings-updated', data)
    }
  }

  const emitServiceUpdated = (data: any) => {
    if (socketRef.current) {
      socketRef.current.emit('service-updated', data)
    }
  }

  const emitPrinterUpdated = (data: any) => {
    if (socketRef.current) {
      socketRef.current.emit('printer-updated', data)
    }
  }

  return {
    isConnected,
    socket,
    joinRoom,
    leaveRoom,
    emitTicketCalled,
    emitTicketServed,
    emitTicketCreated,
    emitDisplaySettingsUpdated,
    emitSoundSettingsUpdated,
    emitServiceUpdated,
    emitPrinterUpdated,
  }
}

export default useSocket