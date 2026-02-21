import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';
const WS_URL = API_URL.replace('/api', '');

let socket: Socket | null = null;

export const socketService = {
    connect: () => {
        if (!socket) {
            const token = localStorage.getItem('bizhub_token');
            socket = io(WS_URL, {
                auth: { token },
                transports: ['websocket'],
            });

            socket.on('connect', () => {
                console.log('Socket connected:', socket?.id);
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });
        }
        return socket;
    },

    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
        }
    },

    getSocket: () => socket,
};
