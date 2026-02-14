import './RoomControls.css';

export default function RoomControls({
    isMuted, onToggleMute, onRaiseHand, hasRaisedHand,
    onLeave, onEndRoom, isHost, muteAll, setSpeakersAllowed, settings
}) {
    const speakersAllowed = settings?.speakersAllowed ?? true;
    const canUnmute = isHost || speakersAllowed;

    const handleMuteClick = () => {
        if (!canUnmute && isMuted) {
            if (window.confirm("Microphones are disabled. Raise hand to request to speak?")) {
                if (!hasRaisedHand) onRaiseHand();
            }
            return;
        }
        onToggleMute();
    };

    return (
        <div className="room-controls">
            {isHost && (
                <div className="host-controls animate-slide-up">
                    <button className="btn btn-secondary btn-sm" onClick={muteAll} title="Mute everyone else">
                        🔇 Mute All
                    </button>
                    <button
                        className={`btn btn-sm ${speakersAllowed ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={() => setSpeakersAllowed(!speakersAllowed)}
                        title={speakersAllowed ? "Allow anyone to speak" : "Only host can speak"}
                    >
                        {speakersAllowed ? '🔓 Open Floor' : '🔒 Stage Mode'}
                    </button>
                </div>
            )}
            <div className="controls-inner">
                <button
                    className={`btn btn-icon control-btn ${isMuted ? 'muted' : 'active'} ${!canUnmute && isMuted ? 'locked' : ''}`}
                    onClick={handleMuteClick}
                    title={!canUnmute ? 'Microphone Disabled' : (isMuted ? 'Unmute' : 'Mute')}
                >
                    {!canUnmute && isMuted ? '🔒' : (isMuted ? '🔇' : '🎤')}
                </button>

                <button
                    className={`btn btn-icon control-btn ${hasRaisedHand ? 'raised' : ''}`}
                    onClick={onRaiseHand}
                    title={hasRaisedHand ? 'Lower Hand' : 'Raise Hand'}
                >
                    {hasRaisedHand ? '✋' : '🤚'}
                </button>

                <button
                    className="btn btn-icon control-btn leave"
                    onClick={onLeave}
                    title="Leave Room"
                >
                    🚪
                </button>

                {isHost && (
                    <button
                        className="btn btn-danger end-btn"
                        onClick={onEndRoom}
                    >
                        End Room
                    </button>
                )}
            </div>
        </div>
    );
}
