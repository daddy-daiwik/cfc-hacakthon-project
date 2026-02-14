import './TagFilter.css';

export default function TagFilter({ tags, activeTags, onToggle }) {
    if (!tags || tags.length === 0) return null;

    return (
        <div className="tag-filter">
            <button
                className={`tag ${activeTags.length === 0 ? 'active' : ''}`}
                onClick={() => onToggle(null)}
            >
                All
            </button>
            {tags.map(tag => (
                <button
                    key={tag}
                    className={`tag ${activeTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => onToggle(tag)}
                >
                    #{tag}
                </button>
            ))}
        </div>
    );
}
