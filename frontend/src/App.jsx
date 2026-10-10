import { useEffect, useMemo, useRef, useState } from "react";
import AppSidebar from "./components/AppSidebar.jsx";
import ChatHeader from "./components/ChatHeader.jsx";
import WelcomeScreen from "./components/WelcomeScreen.jsx";
import ChatMessage from "./components/ChatMessage.jsx";
import MessageInput from "./components/MessageInput.jsx";
import LoadingIndicator from "./components/LoadingIndicator.jsx";
import ErrorMessage from "./components/ErrorMessage.jsx";
import DeleteConversationDialog from "./components/DeleteConversationDialog.jsx";
import RenameConversationDialog from "./components/RenameConversationDialog.jsx";
import { ChatApiError, parseResumePdf, sendChat } from "./lib/api.js";
import { loadConversations, saveConversations } from "./lib/storage.js";

const PRIMARY_THEME_KEY = "orvexa-theme";
const LEGACY_THEME_KEY = "nexa-theme";

function getInitialTheme() {
  return (
    localStorage.getItem(PRIMARY_THEME_KEY) ||
    localStorage.getItem(LEGACY_THEME_KEY) ||
    "dark"
  );
}

function makeConversation() {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [],
    updatedAt: Date.now(),
  };
}

function makeTitle(text) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 38 ? `${trimmed.slice(0, 38).trimEnd()}…` : trimmed;
}

export default function App() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(() => loadConversations()[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState("chat");
  const [pendingChatId, setPendingChatId] = useState(null);
  const [resumeDocument, setResumeDocument] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dialog states
  const [deleteDialogChat, setDeleteDialogChat] = useState(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [renameDialogChat, setRenameDialogChat] = useState(null);

  const bottomRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const abortControllerRef = useRef(null);

  const activeChat = useMemo(
    () => conversations.find((chat) => chat.id === activeId) ?? null,
    [conversations, activeId],
  );
  const busy = pendingChatId !== null;
  const visibleError = error?.chatId === activeId ? error.value : null;

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(PRIMARY_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeChat?.messages, busy]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        createNewChat();
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function createNewChat() {
    // If generation is active in another chat, stop it gracefully
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPendingChatId(null);

    const chat = makeConversation();
    setConversations((items) => [chat, ...items]);
    activeIdRef.current = chat.id;
    setActiveId(chat.id);
    setDraft("");
    setError(null);
    setMode("chat");
    setResumeDocument(null);
    setMobileOpen(false);
  }

  function updateChat(chatId, updater) {
    setConversations((items) =>
      items.map((chat) => (chat.id === chatId ? updater(chat) : chat)),
    );
  }

  async function executeChatRequest(chatId, messagesForContext, requestMode) {
    setPendingChatId(chatId);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const reply = await sendChat(
        messagesForContext.map(({ role, content: text }) => ({
          role,
          content: text,
        })),
        requestMode,
        controller.signal,
      );

      updateChat(chatId, (current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: reply,
            createdAt: Date.now(),
          },
        ],
        updatedAt: Date.now(),
      }));
    } catch (requestError) {
      if (requestError.name === "AbortError") {
        // Generation stopped by user
        return;
      }
      setError({ chatId, value: requestError });
    } finally {
      setPendingChatId(null);
      abortControllerRef.current = null;
    }
  }

  async function sendMessage(rawText = draft, requestMode = mode) {
    const content = rawText.trim();
    if (!content || busy) return;

    const chat = activeChat || makeConversation();
    const isNew = !activeChat;
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: Date.now(),
    };
    const messages = [...(chat.messages || []), userMessage];
    const chatWithUser = {
      ...chat,
      title: chat.messages?.length ? chat.title : makeTitle(content),
      messages,
      updatedAt: Date.now(),
    };

    activeIdRef.current = chat.id;
    setActiveId(chat.id);
    setConversations((items) => {
      const next = items.map((item) =>
        item.id === chat.id ? chatWithUser : item,
      );
      return isNew ? [chatWithUser, ...next] : next;
    });

    setDraft("");
    setError(null);

    await executeChatRequest(chat.id, messages, requestMode);
  }

  function stopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPendingChatId(null);
  }

  async function regenerateResponse(assistantMessageId) {
    if (busy || !activeChat) return;

    const messages = activeChat.messages;
    const msgIndex = messages.findIndex((m) => m.id === assistantMessageId);
    if (msgIndex === -1) return;

    // Slices conversation to include up to the user message immediately preceding this assistant message
    const messagesBefore = messages.slice(0, msgIndex);
    const lastUserIdx = messagesBefore.map((m) => m.role).lastIndexOf("user");
    if (lastUserIdx === -1) return;

    const contextMessages = messagesBefore.slice(0, lastUserIdx + 1);

    updateChat(activeChat.id, (current) => ({
      ...current,
      messages: contextMessages,
      updatedAt: Date.now(),
    }));

    await executeChatRequest(activeChat.id, contextMessages, mode);
  }

  function handleConfirmClearChat() {
    if (!activeChat) return;
    updateChat(activeChat.id, (chat) => ({
      ...chat,
      messages: [],
      updatedAt: Date.now(),
    }));
    setClearDialogOpen(false);
    setError(null);
  }

  async function uploadResume(file) {
    const targetChatId = activeIdRef.current;
    setError(null);
    setResumeDocument(null);
    if (file.size > 5 * 1024 * 1024) {
      setError({
        chatId: targetChatId,
        value: new ChatApiError(
          "PDF resumes must be 5 MB or smaller.",
          413,
          "UPLOAD_TOO_LARGE",
        ),
      });
      return;
    }
    setUploadingResume(true);
    try {
      const parsed = await parseResumePdf(file);
      if (activeIdRef.current !== targetChatId) return;
      setResumeDocument({
        filename: file.name,
        pages: parsed.pages,
        text: parsed.text,
        truncated: parsed.truncated,
      });
      setMode("resume");
    } catch (uploadError) {
      if (activeIdRef.current === targetChatId) {
        setError({ chatId: targetChatId, value: uploadError });
      }
    } finally {
      setUploadingResume(false);
    }
  }

  function reviewResume() {
    if (!resumeDocument) return;
    const prompt = `Please review my resume with actionable feedback. Identify strengths and improvement areas, assess skill gaps only against a target role I provide (ask me for one if I have not provided it), and suggest relevant interview questions. Do not invent experience or give an ATS score. Treat this as guidance, not a hiring guarantee.\n\nResume text:\n${resumeDocument.text}`;
    setMode("resume");
    setResumeDocument(null);
    void sendMessage(prompt, "resume");
  }

  function handleConfirmRename(newTitle) {
    if (renameDialogChat) {
      updateChat(renameDialogChat.id, (chat) => ({
        ...chat,
        title: newTitle,
        updatedAt: Date.now(),
      }));
    }
    setRenameDialogChat(null);
  }

  function handleConfirmDelete() {
    if (!deleteDialogChat) return;
    const id = deleteDialogChat.id;
    setConversations((items) => items.filter((chat) => chat.id !== id));
    if (activeId === id) {
      const remaining = conversations.filter((chat) => chat.id !== id);
      activeIdRef.current = remaining[0]?.id ?? null;
      setActiveId(remaining[0]?.id ?? null);
      setError(null);
      setResumeDocument(null);
    }
    setDeleteDialogChat(null);
  }

  const isWelcome = !activeChat || activeChat.messages.length === 0;

  return (
    <div className="app-shell">
      <AppSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => {
          activeIdRef.current = id;
          setActiveId(id);
          setError(null);
          setResumeDocument(null);
        }}
        onNew={createNewChat}
        onRequestRename={(chat) => setRenameDialogChat(chat)}
        onRequestDelete={(chat) => setDeleteDialogChat(chat)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((value) => !value)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />

      <main className={`main-panel ${sidebarCollapsed ? "main-expanded" : ""}`}>
        <ChatHeader
          activeChat={activeChat}
          mode={mode}
          hasMessages={Boolean(activeChat && activeChat.messages.length > 0)}
          onOpenMobile={() => setMobileOpen(true)}
          onNewChat={createNewChat}
          onClearChat={() => setClearDialogOpen(true)}
        />

        {isWelcome ? (
          <div className="conversation-stage welcome-stage">
            <WelcomeScreen
              onPrompt={(prompt, chosenMode) => {
                if (chosenMode) setMode(chosenMode);
                sendMessage(prompt, chosenMode || mode);
              }}
              onModeChange={(nextMode) => setMode(nextMode)}
            />
          </div>
        ) : (
          <div className="conversation-stage chat-stage">
            <div className="messages-column">
              {activeChat.messages.map((message, index) => {
                const isLatestAssistant =
                  message.role === "assistant" &&
                  index === activeChat.messages.length - 1;
                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isLatestAssistant={isLatestAssistant}
                    isBusy={busy}
                    onRegenerate={regenerateResponse}
                  />
                );
              })}

              {busy && <LoadingIndicator onStop={stopGeneration} />}

              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {visibleError && (
          <ErrorMessage
            error={visibleError}
            onDismiss={() => setError(null)}
          />
        )}

        <MessageInput
          value={draft}
          onChange={setDraft}
          onSend={() => sendMessage()}
          onStop={stopGeneration}
          disabled={busy}
          mode={mode}
          onModeChange={setMode}
          onResumeFile={uploadResume}
          resumeDocument={resumeDocument}
          uploadingResume={uploadingResume}
          onClearResume={() => setResumeDocument(null)}
          onReviewResume={reviewResume}
        />
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConversationDialog
        isOpen={Boolean(deleteDialogChat)}
        title={`Delete "${deleteDialogChat?.title}"?`}
        description="Are you sure you want to delete this conversation? All messages in this chat will be permanently removed."
        confirmLabel="Delete conversation"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteDialogChat(null)}
      />

      {/* Clear Conversation Dialog */}
      <DeleteConversationDialog
        isOpen={clearDialogOpen}
        title="Clear conversation?"
        description="Are you sure you want to clear all messages in this conversation? This action cannot be undone."
        confirmLabel="Clear all messages"
        onConfirm={handleConfirmClearChat}
        onClose={() => setClearDialogOpen(false)}
      />

      {/* Rename Conversation Dialog */}
      <RenameConversationDialog
        isOpen={Boolean(renameDialogChat)}
        initialTitle={renameDialogChat?.title || ""}
        onRename={handleConfirmRename}
        onClose={() => setRenameDialogChat(null)}
      />
    </div>
  );
}
