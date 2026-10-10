import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DeleteConversationDialog({
  isOpen,
  title = "Delete conversation?",
  description = "Are you sure you want to delete this conversation? This action cannot be undone.",
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    confirmButtonRef.current?.focus();

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-desc"
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
          <span className="modal-icon-badge danger" aria-hidden="true">
            <AlertTriangle size={18} />
          </span>
          <div>
            <h3 id="dialog-title" className="modal-title">
              {title}
            </h3>
            <p id="dialog-desc" className="modal-description">
              {description}
            </p>
          </div>
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
            ref={confirmButtonRef}
            type="button"
            className="modal-button danger"
            onClick={onConfirm}
          >
            <Trash2 size={14} />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
