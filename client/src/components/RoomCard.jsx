import './RoomCard.css';

export default function RoomCard({ room, onJoin }) {
    const timeAgo = getTimeAgo(room.createdAt);

    return (
        <div className="room-card card" onClick={() => onJoin(room.id)}>
            <div className="room-card-header">
                <div className="live-badge">LIVE</div>
                <span className="room-time">{timeAgo}</span>
            </div>
            <h3 className="room-title">{room.title}</h3>
            <div className="room-tags">
                {room.tags.map(tag => (
                    <span className="tag" key={tag}>#{tag}</span>
                ))}
            </div>
            <div className="room-footer">
                <div className="room-host">
                    <div className="host-avatar">
                        {room.hostName.charAt(0).toUpperCase()}
                    </div>
                    <span className="host-name">{room.hostName}</span>
                </div>
                <div className="room-participants-count">
                    <span className="participants-icon">👥</span>
                    <span>{room.participantCount}</span>
                </div>
            </div>
            <div className="room-participant-avatars">
                {room.participants?.slice(0, 5).map((p, i) => (
                    <div className="mini-avatar" key={p.id} style={{ zIndex: 5 - i }}>
                        {p.name.charAt(0).toUpperCase()}
                    </div>
                ))}
                {room.participantCount > 5 && (
                    <div className="mini-avatar more">+{room.participantCount - 5}</div>
                )}
            </div>
        </div>
    );
}

function getTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
}
