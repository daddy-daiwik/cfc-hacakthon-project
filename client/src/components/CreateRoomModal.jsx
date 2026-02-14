import { useState } from 'react';
import './CreateRoomModal.css';

export default function CreateRoomModal({ onClose, onCreate }) {
    const [title, setTitle] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [type, setType] = useState('public');
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);

    const addTag = () => {
        const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (tag && !tags.includes(tag) && tags.length < 5) {
            setTags([...tags, tag]);
            setTagInput('');
        }
    };

    const removeTag = (tag) => {
        setTags(tags.filter(t => t !== tag));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) return;
        if (type === 'private' && !accessCode.trim()) return;
        setLoading(true);
        await onCreate({ title: title.trim(), tags, type, accessCode });
        setLoading(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal animate-slide-up" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Go Live 🎙️</h2>
                    <button className="btn btn-ghost btn-icon-sm" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Room Title</label>
                        <input
                            className="input"
                            placeholder="What do you want to talk about?"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            maxLength={80}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Room Type</label>
                        <div className="radio-group" style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    checked={type === 'public'}
                                    onChange={() => setType('public')}
                                />
                                🌐 Public
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    checked={type === 'private'}
                                    onChange={() => setType('private')}
                                />
                                🔒 Private
                            </label>
                        </div>
                    </div>

                    {type === 'private' && (
                        <div className="form-group animate-fade-in">
                            <label className="form-label">Access Code</label>
                            <input
                                className="input"
                                placeholder="e.g. 1234"
                                value={accessCode}
                                onChange={e => setAccessCode(e.target.value)}
                                maxLength={20}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Tags (up to 5)</label>
                        <div className="tag-input-row">
                            <input
                                className="input"
                                placeholder="Add a tag..."
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                maxLength={20}
                            />
                            <button className="btn btn-secondary" onClick={addTag} disabled={!tagInput.trim()}>
                                Add
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="tag-list">
                                {tags.map(tag => (
                                    <span className="tag" key={tag}>
                                        #{tag}
                                        <button className="tag-remove" onClick={() => removeTag(tag)}>✕</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={!title.trim() || loading || (type === 'private' && !accessCode.trim())}
                    >
                        {loading ? '...' : '🔴 Go Live'}
                    </button>
                </div>
            </div>
        </div>
    );
}
