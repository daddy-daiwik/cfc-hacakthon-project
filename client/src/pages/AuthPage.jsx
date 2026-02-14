import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

export default function AuthPage() {
    const [tab, setTab] = useState('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (tab === 'login') {
                await login(username, password);
            } else {
                await signup(username, password);
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container animate-slide-up">
                <div className="auth-header">
                    <span className="auth-icon">🎙️</span>
                    <h1 className="auth-title">VoiceRoom</h1>
                    <p className="auth-subtitle">Join live conversations that matter</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => { setTab('login'); setError(''); }}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
                        onClick={() => { setTab('signup'); setError(''); }}
                    >
                        Sign Up
                    </button>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            className="input"
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            autoFocus
                            minLength={2}
                        />
                    </div>
                    <div className="form-group">
                        <input
                            className="input"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={4}
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
                        {loading ? '...' : tab === 'login' ? 'Login' : 'Create Account'}
                    </button>
                </form>
            </div>
        </div>
    );
}
