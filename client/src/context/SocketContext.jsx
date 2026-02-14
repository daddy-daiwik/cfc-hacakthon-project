import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
    const { token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const socketRef = useRef(null);

    // Get API URL from env or default to current hostname
    const SERVER_URL = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3001`).replace(/\/$/, '');

    useEffect(() => {
        if (!token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        if (socketRef.current) return;

        const newSocket = io(SERVER_URL, {
            auth: { token },
            path: '/socket.io', // Explicitly match server config
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
        });

        newSocket.on('connect', () => {
            console.log('✅ Socket connected');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Socket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        return () => {
            // changing auth state or unmount shouldn't necessarily kill the socket immediately 
            // unless we logged out. But here we depend on [token].
            // If token changes, we disconnect and reconnect.
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
                setConnected(false);
            }
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
};
