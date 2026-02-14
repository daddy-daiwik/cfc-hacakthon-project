import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import TagFilter from '../components/TagFilter';
import CreateRoomModal from '../components/CreateRoomModal';
import './FeedPage.css';

export default function FeedPage() {
    const { socket, connected } = useSocket();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]); // This will be "allRooms"
    const [allTags, setAllTags] = useState([]);
    const [activeTags, setActiveTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);

    const handleJoinByCode = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        setIsJoining(true);
        socket.emit('room:find-by-code', { code: joinCode.trim() }, ({ success, roomId, error }) => {
            setIsJoining(false);
            if (success) {
                // Determine if user entered Access Code or Room ID
                // If it looks like an access code (e.g. short, not UUID), pass it.
                // Assuming access codes are shorter user-defined strings.
                // Or simply pass the code query param if it matches what the server accepted.
                navigate(`/room/${roomId}?code=${encodeURIComponent(joinCode.trim())}`);
            } else {
                alert(error || 'Room not found');
            }
        });
    };

    // Fetch rooms
    const fetchRooms = useCallback(() => {
        if (!socket) return;
        socket.emit('room:list', {}, ({ success, rooms: r }) => {
            if (success) setRooms(r);
        });
    }, [socket]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    // Fetch tags
    useEffect(() => {
        if (!connected) return;
        const apiBase = `http://${window.location.hostname}:3001`;
        fetch(`${apiBase}/api/tags`)
            .then(r => r.json())
            .then(tags => setAllTags(tags))
            .catch(() => { });
    }, [connected]);

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        const onListUpdate = (updatedRooms) => {
            setRooms(updatedRooms);
        };

        socket.on('room:list-update', onListUpdate);
        return () => socket.off('room:list-update', onListUpdate);
    }, [socket]);

    const handleToggleTag = (tag) => {
        if (tag === null) {
            setActiveTags([]);
        } else {
            setActiveTags(prev =>
                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
            );
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesTag = activeTags.length === 0 || room.tags.some(t => activeTags.includes(t));
        const matchesSearch = room.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

    const handleCreateRoom = async ({ title, tags, type, accessCode }) => {
        if (!socket) {
            alert('Not connected to server');
            return;
        }
        return new Promise((resolve) => {
            socket.emit('room:create', { title, tags, type, accessCode }, ({ success, room, error }) => {
                if (success) {
                    setShowCreate(false);

                    let msg = `🎉 Room Created!\n\n🆔 Room ID: ${room.id}`;
                    if (room.type === 'private' && room.accessCode) {
                        msg += `\n🔑 Access Code: ${room.accessCode}`;
                        msg += `\n\n(Share this code with friends so they can join!)`;
                    }
                    alert(msg);

                    navigate(`/room/${room.id}`);
                } else {
                    console.error('Failed to create room:', error);
                    alert(error || 'Failed to create room');
                }
                resolve();
            });
        });
    };

    const handleJoinRoom = (roomId) => {
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="page">
            <Navbar />
            <div className="page-content">
                <div className="feed-header">
                    <div className="feed-header-left">
                        <h1 className="feed-title">Live Now 🔴</h1>
                        <p className="feed-subtitle">{filteredRooms.length} active room{filteredRooms.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="feed-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="search-box">
                            <input
                                className="input"
                                placeholder="🔍 Search rooms..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '200px' }}
                            />
                        </div>
                        <div className="divider" style={{ width: '1px', height: '30px', background: 'var(--border)', margin: '0 5px' }}></div>
                        <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                className="input"
                                placeholder="Enter Access Code"
                                value={joinCode}
                                onChange={e => setJoinCode(e.target.value)}
                                style={{ width: '150px' }}
                            />
                            <button className="btn btn-secondary" type="submit" disabled={!joinCode.trim() || isJoining}>
                                {isJoining ? '...' : 'Join'}
                            </button>
                        </form>
                        <button className="btn btn-primary create-btn" onClick={() => setShowCreate(true)}>
                            ＋ Go Live
                        </button>
                    </div>
                </div>

                {allTags.length > 0 && (
                    <div className="feed-tags">
                        <TagFilter tags={allTags} activeTags={activeTags} onToggle={handleToggleTag} />
                    </div>
                )}

                {filteredRooms.length === 0 ? (
                    <div className="feed-empty">
                        <div className="empty-icon">🎙️</div>
                        <h3>No rooms found</h3>
                        <p>{rooms.length === 0 ? "Be the first to go live!" : "Try adjusting your search or filters"}</p>
                        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                            Start a Room
                        </button>
                    </div>
                ) : (
                    <div className="feed-grid">
                        {filteredRooms.map(room => (
                            <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
                        ))}
                    </div>
                )}
            </div>

            {showCreate && (
                <CreateRoomModal onClose={() => setShowCreate(false)} onCreate={handleCreateRoom} />
            )}
        </div>
    );
}
