import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SERVER_URL = `http://${window.location.hostname}:3001`;

export function SocketProvider({ children }) {
    const { token, logout } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!token) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const s = io(SERVER_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        s.on('connect', () => {
            console.log('🔌 Socket connected');
            setConnected(true);
        });

        s.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setConnected(false);
        });

        s.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            if (err.message === 'Invalid token' || err.message === 'Authentication required') {
                logout();
            }
        });

        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
}
