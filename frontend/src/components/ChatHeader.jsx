import { Eraser, Menu, Orbit, Plus } from "lucide-react";

export const MODE_LABELS = {
  chat: "GENERAL WORKSPACE",
  coding: "CODING ASSISTANT",
  study: "STUDY ASSISTANT",
  interview: "INTERVIEW PREP",
  resume: "RESUME COACH",
};

export default function ChatHeader({
  activeChat,
  mode,
  hasMessages = false,
  onOpenMobile,
  onNewChat,
  onClearChat,
}) {
  const modeLabel = MODE_LABELS[mode] || "YOUR WORKSPACE";
  const chatTitle = activeChat?.title || "New conversation";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-button mobile-menu-button"
          onClick={onOpenMobile}
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <Menu size={19} />
        </button>

        <div className="topbar-context">
          <span className="topbar-context-label">{modeLabel}</span>
          <span className="topbar-divider" aria-hidden="true">
            /
          </span>
          <span className="topbar-context-current" title={chatTitle}>
            {chatTitle}
          </span>
        </div>
      </div>

      <div className="topbar-right">
        {hasMessages && onClearChat && (
          <button
            type="button"
            className="topbar-action-btn"
            onClick={onClearChat}
            aria-label="Clear all messages in this conversation"
            title="Clear conversation"
          >
            <Eraser size={14} />
            <span className="action-btn-text">Clear chat</span>
          </button>
        )}

        <button
          type="button"
          className="topbar-action-btn new-chat-quick"
          onClick={onNewChat}
          aria-label="Start a new conversation"
          title="New conversation"
        >
          <Plus size={14} />
          <span className="action-btn-text">New chat</span>
        </button>

        <div className="topbar-engine-status" title="Powered by Google Gemini API">
          <Orbit size={13} className="engine-icon" />
          <span>Zenvora AI</span>
        </div>

        <div className="topbar-avatar" aria-label="Zenvora AI Workspace">
          <Orbit size={15} />
        </div>
      </div>
    </header>
  );
}
