import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Check, Copy, RotateCw, Sparkles, UserRound } from "lucide-react";
import { BrandMark } from "./Brand.jsx";
import CodeBlock from "./CodeBlock.jsx";

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatMessage({
  message,
  isLatestAssistant = false,
  isBusy = false,
  onRegenerate,
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const isAssistant = message.role === "assistant";
  const timeString = formatTimestamp(message.createdAt);

  async function copyResponse() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = message.content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setCopyFailed(false);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyFailed(true);
      window.setTimeout(() => setCopyFailed(false), 2000);
    }
  }

  return (
    <article
      className={`message-row ${isAssistant ? "assistant-row" : "user-row"}`}
      aria-label={`${isAssistant ? "Zenvora AI" : "You"} said at ${timeString || "recent"}`}
    >
      <div className={`message-avatar ${isAssistant ? "assistant-avatar" : "user-avatar"}`}>
        {isAssistant ? <BrandMark /> : <UserRound size={17} />}
      </div>

      <div className="message-content">
        <div className="message-meta">
          <span className="message-author">{isAssistant ? "Zenvora AI" : "You"}</span>
          {isAssistant && (
            <span className="message-ai-tag">
              <Sparkles size={10} /> AI
            </span>
          )}
          {timeString && <span className="message-time">{timeString}</span>}
        </div>

        <div className={isAssistant ? "markdown-body" : "user-message-bubble"}>
          {isAssistant ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                pre: CodeBlock,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            message.content
          )}
        </div>

        {isAssistant && (
          <div className="message-actions">
            <button
              type="button"
              className="message-action-btn"
              onClick={copyResponse}
              aria-label={copied ? "Response copied" : copyFailed ? "Copy unavailable" : "Copy response"}
              title={copied ? "Copied to clipboard" : "Copy response"}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? "Copied" : copyFailed ? "Unavailable" : "Copy"}</span>
            </button>

            {onRegenerate && (
              <button
                type="button"
                className="message-action-btn"
                onClick={() => onRegenerate(message.id)}
                disabled={isBusy}
                aria-label="Regenerate this response"
                title="Regenerate response"
              >
                <RotateCw size={12} className={isBusy ? "spinning" : ""} />
                <span>Regenerate</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
