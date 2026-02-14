import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = `http://${window.location.hostname}:3001/api`;
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem('voiceroom_auth');
        if (saved) {
            try {
                const { user: u, token: t } = JSON.parse(saved);
                setUser(u);
                setToken(t);
            } catch { }
        }
        setLoading(false);
    }, []);

    const saveAuth = (u, t) => {
        setUser(u);
        setToken(t);
        localStorage.setItem('voiceroom_auth', JSON.stringify({ user: u, token: t }));
    };

    const signup = async (username, password) => {
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        saveAuth(data.user, data.token);
        return data;
    };

    const login = async (username, password) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        saveAuth(data.user, data.token);
        return data;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('voiceroom_auth');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
