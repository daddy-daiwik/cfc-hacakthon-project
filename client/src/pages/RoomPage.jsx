import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../hooks/useRoom';
import { useWebRTC } from '../hooks/useWebRTC';
import Navbar from '../components/Navbar';
import ParticipantCircle from '../components/ParticipantCircle';
import ChatPanel from '../components/ChatPanel';
import RoomControls from '../components/RoomControls';
import './RoomPage.css';

export default function RoomPage() {
    const { roomId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { user } = useAuth();
    const [joined, setJoined] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [error, setError] = useState('');
    const [accessCode, setAccessCode] = useState(searchParams.get('code') || '');

    const {
        room, participants, messages, isHost, ended, kicked,
        sendMessage, raiseHand, lowerHand, muteUser, unmuteUser,
        kickUser, endRoom, leaveRoom,
        muteAll, setSpeakersAllowed,
    } = useRoom(roomId);

    const { remoteStreams, isMuted, toggleMute, forceMute, forceUnmute, error: rtcError } = useWebRTC(roomId, joined);

    const joinRoom = (code = null) => {
        if (!socket || !roomId) return;
        socket.emit('room:join', { roomId, accessCode: code }, ({ success, error: err }) => {
            if (success) {
                setJoined(true);
                setError('');
            } else {
                setError(err || 'Failed to join room');
            }
        });
    };

    // Join room on mount
    useEffect(() => {
        if (joined) return;
        // Default to state value (from URL param) if 'code' arg is not passed explicitly to joinRoom
        joinRoom(accessCode);
    }, [socket, roomId]);

    // Handle room ended
    useEffect(() => {
        if (ended) {
            navigate('/', { replace: true });
        }
    }, [ended, navigate]);

    // Handle being kicked
    useEffect(() => {
        if (kicked) {
            navigate('/', { replace: true });
        }
    }, [kicked, navigate]);

    // Play remote audio streams
    useEffect(() => {
        remoteStreams.forEach(({ stream }, peerId) => {
            let audio = document.getElementById(`audio-${peerId}`);
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `audio-${peerId}`;
                audio.autoplay = true;
                audio.playsInline = true;
                document.body.appendChild(audio);
            }
            if (audio.srcObject !== stream) {
                audio.srcObject = stream;
            }
        });

        // Clean up removed streams
        document.querySelectorAll('audio[id^="audio-"]').forEach(audio => {
            const peerId = audio.id.replace('audio-', '');
            if (!remoteStreams.has(peerId)) {
                audio.srcObject = null;
                audio.remove();
            }
        });

        return () => {
            document.querySelectorAll('audio[id^="audio-"]').forEach(audio => {
                audio.srcObject = null;
                audio.remove();
            });
        };
    }, [remoteStreams]);

    // Listen for forced mute from host
    // Listen for forced mute/unmute from host
    useEffect(() => {
        if (!socket) return;
        
        const onMuted = ({ userId: mutedId }) => {
            if (mutedId === user?.id) {
                forceMute();
            }
        };

        const onUnmuted = ({ userId: unmutedId }) => {
            if (unmutedId === user?.id) {
                // Host unmuted us, so we force unmute locally
                forceUnmute();
            }
        };

        socket.on('mod:user-muted', onMuted);
        socket.on('mod:user-unmuted', onUnmuted);
        
        return () => {
            socket.off('mod:user-muted', onMuted);
            socket.off('mod:user-unmuted', onUnmuted);
        };
    }, [socket, user?.id, forceMute, forceUnmute]);

    const currentParticipant = participants.find(p => p.id === user?.id);
    const hasRaisedHand = currentParticipant?.hasRaisedHand || false;

    const handleRaiseHand = () => {
        if (hasRaisedHand) {
            lowerHand();
        } else {
            raiseHand();
        }
    };

    const handleLeave = () => {
        leaveRoom(() => {
            navigate('/', { replace: true });
        });
    };

    const handleEndRoom = () => {
        if (window.confirm('End this room for everyone?')) {
            endRoom(() => {
                navigate('/', { replace: true });
            });
        }
    };

    const handleMuteUser = (targetId) => {
        const target = participants.find(p => p.id === targetId);
        if (target?.isMuted) {
            unmuteUser(targetId);
        } else {
            muteUser(targetId);
        }
    };

    if (error === 'Invalid access code') {
        return (
            <div className="page">
                <Navbar />
                <div className="room-error">
                    <div className="error-icon">🔒</div>
                    <h2>Private Room</h2>
                    <p>Enter access code to join this room.</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <input
                            className="input"
                            value={accessCode}
                            onChange={e => setAccessCode(e.target.value)}
                            placeholder="Code"
                            autoFocus
                        />
                        <button className="btn btn-primary" onClick={() => joinRoom(accessCode)}>Join</button>
                    </div>
                    <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ marginTop: '10px' }}>Cancel</button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <Navbar />
                <div className="room-error">
                    <h2>😕 Oops!</h2>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Feed</button>
                </div>
            </div>
        );
    }

    if (!room) {
        return (
            <div className="page">
                <Navbar />
                <div className="room-loading">
                    <div className="loading-pulse">🎙️</div>
                    <p>Joining room...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page room-page">
            <Navbar />

            <div className="room-content">
                <div className="room-header">
                    <div className="room-info">
                        <div className="live-badge">LIVE</div>
                        <h1 className="room-name">{room.title}</h1>
                        <div className="room-meta" style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <span title="Click to copy Room ID" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => { navigator.clipboard.writeText(room.id); alert('Room ID copied!'); }}>
                                🆔 {room.id.slice(0, 8)}...
                            </span>
                            {room.type === 'private' && room.accessCode && (
                                <span title="Click to copy Access Code" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}
                                    onClick={() => { navigator.clipboard.writeText(room.accessCode); alert('Access Code copied!'); }}>
                                    🔑 {room.accessCode}
                                </span>
                            )}
                        </div>
                        <div className="room-tags-row">
                            {room.tags.map(tag => (
                                <span className="tag" key={tag}>#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {rtcError && (
                    <div className="error-banner" style={{ background: '#ff4444', color: 'white', padding: '10px', borderRadius: '8px', margin: '0 0 20px 0', fontWeight: 'bold' }}>
                        ⚠️ {rtcError}
                    </div>
                )}
                <div className="participants-grid">
                    {participants.map(participant => (
                        <ParticipantCircle
                            key={participant.id}
                            participant={participant}
                            isHost={isHost}
                            isCurrentUser={participant.id === user?.id}
                            roomHostId={room.hostId}
                            onMute={handleMuteUser}
                            onKick={kickUser}
                        />
                    ))}
                </div>
            </div>

            <ChatPanel
                messages={messages}
                onSend={sendMessage}
                isOpen={chatOpen}
                onToggle={() => setChatOpen(!chatOpen)}
            />

            <RoomControls
                isMuted={isMuted}
                onToggleMute={toggleMute}
                onRaiseHand={handleRaiseHand}
                hasRaisedHand={hasRaisedHand}
                onLeave={handleLeave}
                onEndRoom={handleEndRoom}
                isHost={isHost}
                muteAll={muteAll}
                setSpeakersAllowed={setSpeakersAllowed}
                settings={room?.settings}
            />
        </div>
    );
}
