import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    🎙️ CrowdControl
                </Link>

                <div className="navbar-right">
                    <button
                        onClick={toggleTheme}
                        className="btn btn-icon-sm"
                        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        style={{ marginRight: '10px', background: 'transparent' }}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    {user && (
                        <div className="navbar-user-group">
                            <Link to={`/profile/${user.username}`} className="user-profile-link" title="View Profile">
                                <div className="user-avatar">
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    ) : (
                                        user.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <span className="user-name">{user.username}</span>
                            </Link>
                            <button className="btn btn-ghost btn-icon-sm" onClick={handleLogout} title="Logout">
                                🚪
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
