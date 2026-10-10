import { useState } from "react";
import {
  MessageSquare,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { BrandMark, BrandName } from "./Brand.jsx";
import ConversationSearch from "./ConversationSearch.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

export default function AppSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRequestRename,
  onRequestDelete,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  theme,
  onThemeChange,
}) {
  const [menuId, setMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const sortedChats = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const visibleChats = normalizedSearch
    ? sortedChats.filter(
        (chat) =>
          chat.title.toLowerCase().includes(normalizedSearch) ||
          chat.messages?.some(
            (message) =>
              typeof message?.content === "string" &&
              message.content.toLowerCase().includes(normalizedSearch),
          ),
      )
    : sortedChats;

  function handleStartRename(chat) {
    onRequestRename(chat);
    setMenuId(null);
  }

  function handleStartDelete(chat) {
    onRequestDelete(chat);
    setMenuId(null);
  }

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="mobile-scrim"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? "sidebar-collapsed" : ""} ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
        aria-label="Sidebar navigation"
      >
        <div className="sidebar-brand">
          <BrandMark />
          {!collapsed && <BrandName />}

          <button
            type="button"
            className="icon-button sidebar-collapse"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>

          <button
            type="button"
            className="icon-button mobile-close"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <button
          type="button"
          className="new-chat-button"
          onClick={onNew}
          title="Start a new chat (Ctrl+K or ⌘K)"
        >
          <Plus size={17} strokeWidth={2.2} />
          {!collapsed && <span>New chat</span>}
          {!collapsed && <kbd>⌘ K</kbd>}
        </button>

        {!collapsed && (
          <ConversationSearch
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm("")}
          />
        )}

        <div className="sidebar-section-label">
          {!collapsed && "YOUR CONVERSATIONS"}
        </div>

        <nav className="conversation-list" aria-label="Conversation history">
          {conversations.length === 0 && !collapsed && (
            <p className="history-empty">Your conversations will appear here.</p>
          )}

          {conversations.length > 0 && visibleChats.length === 0 && !collapsed && (
            <p className="history-empty">
              No conversations match “{searchTerm.trim()}”.
            </p>
          )}

          {visibleChats.map((chat) => (
            <div className="conversation-wrap" key={chat.id}>
              <button
                type="button"
                className={`conversation-item ${
                  activeId === chat.id ? "conversation-active" : ""
                }`}
                onClick={() => {
                  onSelect(chat.id);
                  onCloseMobile();
                  setMenuId(null);
                }}
                title={chat.title}
              >
                <MessageSquare size={16} />
                {!collapsed && <span>{chat.title}</span>}
              </button>

              {!collapsed && (
                <button
                  type="button"
                  className="icon-button conversation-menu-trigger"
                  aria-label={`Options for ${chat.title}`}
                  title="More options"
                  onClick={() => setMenuId(menuId === chat.id ? null : chat.id)}
                >
                  <MoreHorizontal size={16} />
                </button>
              )}

              {menuId === chat.id && !collapsed && (
                <div className="conversation-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleStartRename(chat)}
                  >
                    <Pencil size={13} />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="menu-delete"
                    onClick={() => handleStartDelete(chat)}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          <div className="mode-card" title="Powered by Google Gemini">
            <span className="mode-icon">
              <Sparkles size={15} />
            </span>
            {!collapsed && (
              <span className="mode-copy">
                <strong>Zenvora AI Engine</strong>
                <small>Google Gemini 3.8 Flash</small>
              </span>
            )}
          </div>

          <div className="sidebar-footer-row">
            {!collapsed && (
              <span className="footer-note">Your intelligent workspace</span>
            )}
            <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          </div>

          {!collapsed && (
            <p className="sidebar-credit">
              Zenvora AI <span>✳</span> All conversations private
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
