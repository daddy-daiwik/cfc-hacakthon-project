import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import './ProfilePage.css';

export default function ProfilePage() {
    const { username } = useParams();
    const { user: currentUser, token } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Edit form state
    const [editBio, setEditBio] = useState('');
    const [editAvatar, setEditAvatar] = useState('');

    const isOwnProfile = currentUser && currentUser.username === username;

    useEffect(() => {
        fetchProfile();
    }, [username]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const apiBase = `http://${window.location.hostname}:3001`;
            const res = await fetch(`${apiBase}/api/users/${username}`);
            if (!res.ok) throw new Error('User not found');
            const data = await res.json();
            setProfile(data);
            setEditBio(data.bio || '');
            setEditAvatar(data.avatarUrl || '');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const apiBase = `http://${window.location.hostname}:3001`;
            const res = await fetch(`${apiBase}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ bio: editBio, avatarUrl: editAvatar })
            });

            if (!res.ok) throw new Error('Failed to update profile');

            const updated = await res.json();
            setProfile(prev => ({ ...prev, ...updated }));
            setIsEditing(false);
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return (
        <div className="page">
            <Navbar />
            <div className="page-content center-content">
                <div className="loading-spinner"></div>
            </div>
        </div>
    );

    if (error) return (
        <div className="page">
            <Navbar />
            <div className="page-content center-content">
                <h2>User not found 😕</h2>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Feed</button>
            </div>
        </div>
    );

    return (
        <div className="page">
            <Navbar />
            <div className="page-content">
                <div className="profile-card animate-slide-up">
                    <div className="profile-header">
                        <div className="profile-avatar-lg">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt={profile.username} />
                            ) : (
                                profile.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="profile-info">
                            <h1 className="profile-name">
                                {profile.username}
                            </h1>
                            <div className="profile-stats">
                                <span><strong>{profile.followers?.length || 0}</strong> Followers</span>
                                <span><strong>{profile.following?.length || 0}</strong> Following</span>
                            </div>
                        </div>
                        {isOwnProfile && !isEditing && (
                            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                                ✏️ Edit Profile
                            </button>
                        )}
                    </div>

                    <div className="profile-body">
                        {isEditing ? (
                            <div className="edit-form">
                                <div className="form-group">
                                    <label>Bio</label>
                                    <textarea
                                        className="input"
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        maxLength={160}
                                        rows={3}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Avatar URL</label>
                                    <input
                                        className="input"
                                        value={editAvatar}
                                        onChange={e => setEditAvatar(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="form-actions">
                                    <button className="btn btn-primary" onClick={handleSave}>Save</button>
                                    <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <p className="profile-bio">{profile.bio || "No bio yet."}</p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
