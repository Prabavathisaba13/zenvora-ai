export class ChatApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.code = code;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 8000;
const MAX_TOTAL_LENGTH = 30000;

async function readPayload(response) {
  try {
    const payload = await response.json();
    return payload && typeof payload === "object" ? payload : {};
  } catch {
    return {};
  }
}

function recentContext(messages) {
  const selected = [];
  let totalLength = 0;

  for (let index = messages.length - 1; index >= 0 && selected.length < MAX_MESSAGES; index -= 1) {
    const message = messages[index];
    if (message.content.length > MAX_MESSAGE_LENGTH) continue;
    if (totalLength + message.content.length > MAX_TOTAL_LENGTH) break;
    selected.push(message);
    totalLength += message.content.length;
  }

  return selected.reverse();
}

export async function sendChat(messages, mode, signal) {
  let response;
  const context = recentContext(messages);

  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: context, mode }),
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ChatApiError("Could not reach Zenvora AI. Check your connection and try again.", 0, "NETWORK_ERROR");
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new ChatApiError(
      payload.error || "Something went wrong. Please try again.",
      response.status,
      payload.code || "REQUEST_FAILED",
    );
  }

  if (typeof payload.reply !== "string" || !payload.reply.trim()) {
    throw new ChatApiError("The AI returned an empty response. Please try again.", response.status, "EMPTY_RESPONSE");
  }

  return payload.reply;
}

export async function parseResumePdf(file) {
  const formData = new FormData();
  formData.append("file", file);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/resume/parse`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new ChatApiError(
      "Could not upload the PDF to Zenvora AI. Check your connection and try again.",
      0,
      "NETWORK_ERROR",
    );
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new ChatApiError(
      payload.error || "Zenvora AI couldn't process that PDF.",
      response.status,
      payload.code || "PDF_UPLOAD_FAILED",
    );
  }
  if (typeof payload.text !== "string" || !payload.text.trim()) {
    throw new ChatApiError("No readable resume text was returned from the PDF.", response.status, "PDF_NO_TEXT");
  }

  return payload;
}
