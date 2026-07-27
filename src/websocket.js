import { Server } from 'socket.io';

let ioInstance = null;

export function initWebSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  ioInstance.on('connection', (socket) => {
    console.log(`⚡ Client connected to WebSocket: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function notifyAdmin(eventType, payload) {
  if (ioInstance) {
    ioInstance.emit(eventType, {
      timestamp: new Date().toISOString(),
      eventType,
      ...payload,
    });
  }
}
