'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocketClient = (token: { userId: string; hospitalId: string; role: string }) => {
  if (socket) return socket;

  socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
    path: '/api/socket',
    auth: {
      token,
    },
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized. Call initSocketClient first.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Helper functions for common events
export const subscribeToAppointments = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('appointment:updated', callback);
  return () => s.off('appointment:updated', callback);
};

export const subscribeToQueue = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('queue:updated', callback);
  return () => s.off('queue:updated', callback);
};

export const subscribeToNotifications = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('notification:received', callback);
  return () => s.off('notification:received', callback);
};

export const subscribeToUserStatus = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('user:status:changed', callback);
  return () => s.off('user:status:changed', callback);
};

export const subscribeToChatMessages = (callback: (data: any) => void) => {
  const s = getSocket();
  s.on('chat:message:received', callback);
  return () => s.off('chat:message:received', callback);
};

export const updateAppointment = (data: any) => {
  const s = getSocket();
  s.emit('appointment:update', data);
};

export const updateQueue = (data: any) => {
  const s = getSocket();
  s.emit('queue:update', data);
};

export const sendNotification = (data: any) => {
  const s = getSocket();
  s.emit('notification:send', data);
};

export const updateUserStatus = (status: 'online' | 'away' | 'busy' | 'offline') => {
  const s = getSocket();
  s.emit('user:status', status);
};

export const sendChatMessage = (data: { message: string; targetUserId?: number }) => {
  const s = getSocket();
  s.emit('chat:message', data);
};
