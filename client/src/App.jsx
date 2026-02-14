import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import RoomPage from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';
import './index.css';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={
        <ProtectedRoute>
          <FeedPage />
        </ProtectedRoute>
      } />
      <Route path="/room/:roomId" element={
        <ProtectedRoute>
          <RoomPage />
        </ProtectedRoute>
      } />
      <Route path="/profile/:username" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <AppRoutes />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
