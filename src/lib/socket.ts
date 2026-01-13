import { Server } from 'socket.io';

export interface TicketCalledEvent {
  ticketId: string;
  ticketNumber: string;
  serviceCode: string;
  serviceName: string;
  staffName?: string;
  soundUrl?: string;
}

export interface TicketServedEvent {
  ticketId: string;
  ticketNumber: string;
  serviceCode: string;
  serviceName: string;
}

export interface TicketCreatedEvent {
  ticketId: string;
  ticketNumber: string;
  serviceCode: string;
  serviceName: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join rooms based on client type
    socket.on('join-room', (room: string) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room: ${room}`);
    });

    // Leave rooms
    socket.on('leave-room', (room: string) => {
      socket.leave(room);
      console.log(`Client ${socket.id} left room: ${room}`);
    });

    // Handle ticket called event
    socket.on('ticket-called', (data: TicketCalledEvent) => {
      // Broadcast to display room
      io.to('display-room').emit('ticket-called', data);
      
      // Broadcast to staff room
      io.to('staff-room').emit('ticket-called', data);
      
      console.log('Ticket called event broadcasted:', data);
    });

    // Handle ticket served event
    socket.on('ticket-served', (data: TicketServedEvent) => {
      // Broadcast to display room
      io.to('display-room').emit('ticket-served', data);
      
      // Broadcast to staff room
      io.to('staff-room').emit('ticket-served', data);
      
      console.log('Ticket served event broadcasted:', data);
    });

    // Handle ticket created event
    socket.on('ticket-created', (data: TicketCreatedEvent) => {
      // Broadcast to staff room
      io.to('staff-room').emit('ticket-created', data);
      
      // Broadcast to admin room
      io.to('admin-room').emit('ticket-created', data);
      
      console.log('Ticket created event broadcasted:', data);
    });

    // Handle display settings update
    socket.on('display-settings-updated', (data: any) => {
      // Broadcast to display room
      io.to('display-room').emit('display-settings-updated', data);
      
      console.log('Display settings updated event broadcasted:', data);
    });

    // Handle sound settings update
    socket.on('sound-settings-updated', (data: any) => {
      // Broadcast to staff room
      io.to('staff-room').emit('sound-settings-updated', data);
      
      console.log('Sound settings updated event broadcasted:', data);
    });

    // Handle service status update
    socket.on('service-updated', (data: any) => {
      // Broadcast to all rooms
      io.emit('service-updated', data);
      
      console.log('Service updated event broadcasted:', data);
    });

    // Handle printer status update
    socket.on('printer-updated', (data: any) => {
      // Broadcast to admin room
      io.to('admin-room').emit('printer-updated', data);
      
      console.log('Printer updated event broadcasted:', data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Queue Management System',
      timestamp: new Date().toISOString(),
    });
  });
};