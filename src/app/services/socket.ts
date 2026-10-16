import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.io] Connecté au serveur temps réel');
    });

    socket.on('disconnect', () => {
      console.log('⚡ [Socket.io] Déconnecté');
    });
  }
  return socket;
}

export function joinOrder(orderId: string) {
  const s = getSocket();
  if (orderId) s.emit('join:order', orderId);
}

export function leaveOrder(orderId: string) {
  const s = getSocket();
  if (orderId) s.emit('leave:order', orderId);
}

export function joinAdmin() {
  const s = getSocket();
  s.emit('join:admin');
}
