const PRIMARY_STORAGE_KEY = "orvexa-ai-conversations-v1";
const LEGACY_STORAGE_KEY = "nexa-ai-conversations-v1";

export function loadConversations() {
  try {
    const raw =
      localStorage.getItem(PRIMARY_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY) ||
      "[]";
    const saved = JSON.parse(raw);
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (chat) =>
        chat &&
        typeof chat.id === "string" &&
        typeof chat.title === "string" &&
        Array.isArray(chat.messages),
    );
  } catch {
    return [];
  }
}

export function saveConversations(conversations) {
  try {
    localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Could not save conversations in local storage.", error);
  }
}
