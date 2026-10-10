import { useEffect, useRef } from "react";
import { ArrowUp, FileText, Paperclip, Square, Trash2 } from "lucide-react";

export const MODES = [
  ["chat", "General"],
  ["coding", "Coding"],
  ["study", "Study"],
  ["interview", "Interview"],
  ["resume", "Resume"],
];

const MAX_LENGTH = 8000;

export default function MessageInput({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  mode,
  onModeChange,
  onResumeFile,
  resumeDocument,
  uploadingResume,
  onClearResume,
  onReviewResume,
}) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 180)}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSend();
      }
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) onResumeFile(file);
    event.target.value = "";
  }

  const charCount = value.length;
  const isNearLimit = charCount > MAX_LENGTH * 0.8;

  return (
    <div className="composer-area">
      {resumeDocument && (
        <div className="resume-preview" role="status">
          <div className="resume-preview-info">
            <strong>{resumeDocument.filename}</strong>
            <span>
              {resumeDocument.pages} page{resumeDocument.pages === 1 ? "" : "s"} · text extracted
            </span>
            {resumeDocument.truncated && (
              <small>Only the first 7,000 characters were extracted.</small>
            )}
          </div>
          <button
            type="button"
            className="resume-review-button"
            onClick={onReviewResume}
            disabled={disabled}
          >
            Ask Zenvora AI to review
          </button>
          <button
            type="button"
            className="icon-button resume-clear-button"
            onClick={onClearResume}
            aria-label="Remove extracted resume text"
            title="Remove resume"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      <div className={`composer-shell ${disabled ? "composer-busy" : ""}`}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            {
              coding: "Ask about Java, Python, JavaScript, SQL, algorithms, or debug code...",
              study: "Ask to explain a technical concept or create practice questions...",
              interview: "Practice a technical or HR interview question...",
              resume: "Ask for resume feedback, skill-gap analysis, or interview questions...",
            }[mode] || "Ask Zenvora AI anything. Press Enter to send..."
          }
          aria-label="Message Zenvora AI"
          rows={1}
          maxLength={MAX_LENGTH}
          disabled={disabled}
        />

        <div className="composer-controls">
          <div className="composer-tools">
            <label className="mode-select-label">
              <FileText size={13} aria-hidden="true" />
              <select
                value={mode}
                onChange={(event) => onModeChange(event.target.value)}
                aria-label="Select assistant mode"
              >
                {MODES.map(([id, title]) => (
                  <option value={id} key={id}>
                    {title}
                  </option>
                ))}
              </select>
            </label>

            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              aria-label="Upload PDF resume"
            />
            <button
              className="composer-chip"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploadingResume}
              title="Upload a PDF resume for review (max 5 MB)"
            >
              <Paperclip size={13} aria-hidden="true" />
              <span>{uploadingResume ? "Reading PDF..." : "Resume PDF"}</span>
            </button>

            {isNearLimit && (
              <span className={`char-counter ${charCount >= MAX_LENGTH ? "limit-reached" : ""}`}>
                {charCount.toLocaleString()} / {MAX_LENGTH.toLocaleString()}
              </span>
            )}
          </div>

          <div className="composer-actions">
            {disabled ? (
              <button
                type="button"
                className="stop-button"
                onClick={onStop}
                aria-label="Stop generating response"
                title="Stop generation"
              >
                <Square size={13} fill="currentColor" strokeWidth={0} />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                className="send-button"
                onClick={onSend}
                disabled={!value.trim()}
                aria-label="Send message"
                title="Send message (Enter)"
              >
                <ArrowUp size={18} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
      </div>

      <details className="privacy-disclosure">
        <summary>Privacy &amp; workspace storage</summary>
        <p>
          Conversations and theme settings are preserved in your browser's local storage.
          When you send a message, conversation context is securely processed by the Zenvora AI
          backend with Google Gemini. Uploaded PDF resumes are parsed entirely in memory
          and are never stored on the server.
        </p>
      </details>

      <p className="composer-disclaimer">
        Zenvora AI can make mistakes. Verify important information. <span>·</span> Enter to send, Shift + Enter for a new line.
      </p>
    </div>
  );
}
