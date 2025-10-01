import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getToken } from 'next-auth/jwt';

let io: SocketIOServer | null = null;

export const initSocketServer = (httpServer: HTTPServer) => {
  if (io) return io;

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/api/socket',
  });

  io.use(async (socket, next) => {
    try {
      // Authenticate socket connection
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token (you'd need to implement proper JWT verification)
      socket.data.userId = token.userId;
      socket.data.hospitalId = token.hospitalId;
      socket.data.role = token.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, hospitalId, role } = socket.data;

    console.log(`User connected: ${userId} from hospital ${hospitalId}`);

    // Join hospital-specific room
    socket.join(`hospital-${hospitalId}`);

    // Join role-specific room
    socket.join(`role-${role}`);

    // Join user-specific room
    socket.join(`user-${userId}`);

    // Handle appointment updates
    socket.on('appointment:update', (data) => {
      io?.to(`hospital-${hospitalId}`).emit('appointment:updated', {
        ...data,
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle queue updates
    socket.on('queue:update', (data) => {
      io?.to(`hospital-${hospitalId}`).emit('queue:updated', {
        ...data,
        userId,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle notification broadcasts
    socket.on('notification:send', (data) => {
      if (data.targetUserId) {
        io?.to(`user-${data.targetUserId}`).emit('notification:received', {
          ...data,
          timestamp: new Date().toISOString(),
        });
      } else {
        io?.to(`hospital-${hospitalId}`).emit('notification:received', {
          ...data,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Handle user status updates
    socket.on('user:status', (status) => {
      io?.to(`hospital-${hospitalId}`).emit('user:status:changed', {
        userId,
        status,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle chat messages
    socket.on('chat:message', (data) => {
      if (data.targetUserId) {
        // Direct message
        io?.to(`user-${data.targetUserId}`).emit('chat:message:received', {
          ...data,
          from: userId,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Broadcast to hospital
        io?.to(`hospital-${hospitalId}`).emit('chat:message:received', {
          ...data,
          from: userId,
          timestamp: new Date().toISOString(),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      io?.to(`hospital-${hospitalId}`).emit('user:status:changed', {
        userId,
        status: 'offline',
        timestamp: new Date().toISOString(),
      });
    });
  });

  return io;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket server not initialized');
  }
  return io;
};

// Helper functions to emit events from API routes
export const emitToHospital = (hospitalId: number, event: string, data: any) => {
  if (io) {
    io.to(`hospital-${hospitalId}`).emit(event, data);
  }
};

export const emitToUser = (userId: number, event: string, data: any) => {
  if (io) {
    io.to(`user-${userId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role-${role}`).emit(event, data);
  }
};
