import { Search, X } from "lucide-react";

export default function ConversationSearch({ value, onChange, onClear }) {
  return (
    <div className="conversation-search-wrap">
      <label className="conversation-search">
        <Search size={14} aria-hidden="true" className="search-icon" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search conversations..."
          aria-label="Search conversation history"
        />
        {value && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={onClear}
            aria-label="Clear search query"
            title="Clear search"
          >
            <X size={13} />
          </button>
        )}
      </label>
    </div>
  );
}
