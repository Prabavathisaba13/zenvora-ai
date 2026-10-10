import { useEffect, useRef, useState } from "react";
import { Edit3, X } from "lucide-react";

export default function RenameConversationDialog({
  isOpen,
  initialTitle = "",
  onRename,
  onClose,
}) {
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef(null);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    inputRef.current?.focus();
    inputRef.current?.select();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (trimmed) {
      onRename(trimmed);
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div className="modal-header">
          <span className="modal-icon-badge accent" aria-hidden="true">
            <Edit3 size={18} />
          </span>
          <div>
            <h3 id="rename-dialog-title" className="modal-title">
              Rename conversation
            </h3>
            <p className="modal-description">
              Enter a new title for this conversation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-input-wrap">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Conversation title"
              maxLength={100}
              className="modal-text-input"
              aria-label="Conversation title"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-button primary"
              disabled={!title.trim()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
