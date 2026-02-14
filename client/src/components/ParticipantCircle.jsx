import { useAuth } from '../context/AuthContext';
import './ParticipantCircle.css';

export default function ParticipantCircle({ participant, isHost, isCurrentUser, roomHostId, onMute, onKick }) {
    const showHostControls = isHost && !isCurrentUser;
    const initials = participant.name.charAt(0).toUpperCase();
    const isParticipantHost = participant.id === roomHostId;

    return (
        <div className={`participant-circle ${participant.isMuted ? 'muted' : ''}`}>
            <div className={`participant-avatar ${participant.hasRaisedHand ? 'hand-raised' : ''}`}>
                <div className={`avatar-ring ${!participant.isMuted ? 'speaking-ring' : ''}`}>
                    <div className="avatar-inner">
                        {initials}
                    </div>
                </div>

                {participant.hasRaisedHand && (
                    <span className="hand-badge hand-wave">✋</span>
                )}

                {participant.isMuted && (
                    <span className="mute-badge">🔇</span>
                )}

                {isParticipantHost && (
                    <span className="host-badge">👑</span>
                )}
            </div>

            <span className="participant-name">
                {participant.name}
                {isCurrentUser && ' (You)'}
            </span>

            {showHostControls && (
                <div className="host-controls">
                    <button
                        className="btn btn-ghost btn-icon-sm"
                        onClick={() => onMute(participant.id)}
                        title={participant.isMuted ? 'Unmute' : 'Mute'}
                    >
                        {participant.isMuted ? '🔊' : '🔇'}
                    </button>
                    <button
                        className="btn btn-ghost btn-icon-sm"
                        onClick={() => onKick(participant.id)}
                        title="Kick"
                    >
                        ❌
                    </button>
                </div>
            )}
        </div>
    );
}
