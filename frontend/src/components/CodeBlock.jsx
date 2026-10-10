import { isValidElement, useState } from "react";
import { Check, Copy } from "lucide-react";

function textFromNode(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join("");
  if (isValidElement(node)) return textFromNode(node.props.children);
  return "";
}

function detectLanguage(className = "") {
  const match = /language-([a-zA-Z0-9_-]+)/.exec(className);
  if (match) return match[1].toUpperCase();
  return "CODE";
}

export default function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const code = textFromNode(children);
  const language = detectLanguage(className || children?.props?.className || "");

  async function copyCode() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = code;
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
    <div className="code-block-wrap">
      <div className="code-block-toolbar">
        <span className="code-block-lang">
          <span className="code-dot" aria-hidden="true" />
          <span>{language}</span>
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="code-copy-button"
          aria-label={copied ? "Code copied" : copyFailed ? "Copy unavailable" : "Copy code"}
          title={copied ? "Copied to clipboard" : "Copy code"}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied!" : copyFailed ? "Unavailable" : "Copy"}</span>
        </button>
      </div>
      <pre className={className} {...props}>
        {children}
      </pre>
    </div>
  );
}
