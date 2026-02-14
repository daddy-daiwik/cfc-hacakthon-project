import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ChatPanel.css';

export default function ChatPanel({ messages, onSend, isOpen, onToggle }) {
    const [text, setText] = useState('');
    const messagesEndRef = useRef(null);
    const { user } = useAuth();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!text.trim()) return;
        onSend(text.trim());
        setText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={`chat-panel ${isOpen ? 'open' : ''}`}>
            <button className="chat-toggle" onClick={onToggle}>
                💬 Chat {!isOpen && messages.length > 0 && <span className="chat-count">{messages.length}</span>}
            </button>

            {isOpen && (
                <div className="chat-body animate-slide-up">
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="chat-empty">No messages yet. Say hi! 👋</div>
                        )}
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.userId === user?.id ? 'own' : ''}`}
                            >
                                <span className="chat-username">{msg.username}</span>
                                <span className="chat-text">{msg.text}</span>
                                <span className="chat-time" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'flex-end', marginTop: '2px' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-row">
                        <input
                            className="input chat-input"
                            placeholder="Type a message..."
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            maxLength={500}
                        />
                        <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={!text.trim()}>
                            ↑
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
