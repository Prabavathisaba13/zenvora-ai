import { Sparkles, Square } from "lucide-react";
import { BrandMark } from "./Brand.jsx";

export default function LoadingIndicator({ onStop }) {
  return (
    <div className="message-row assistant-row loading-row" role="status" aria-live="polite">
      <div className="message-avatar assistant-avatar">
        <BrandMark />
      </div>
      <div className="message-content">
        <div className="message-meta">
          <span>Zenvora AI</span>
          <span className="message-ai-tag">
            <Sparkles size={10} /> THINKING
          </span>
        </div>
        <div className="typing-indicator" aria-label="Zenvora AI is responding">
          <span className="typing-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="typing-text">Finding the right words...</span>
          {onStop && (
            <button
              type="button"
              className="inline-stop-btn"
              onClick={onStop}
              aria-label="Stop generating response"
              title="Stop generation"
            >
              <Square size={11} fill="currentColor" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
