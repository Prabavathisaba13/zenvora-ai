import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ theme, onThemeChange }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => onThemeChange(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
    >
      <span className={`theme-option ${!isDark ? "selected" : ""}`} title="Light theme">
        <Sun size={13} strokeWidth={2} />
      </span>
      <span className={`theme-option ${isDark ? "selected" : ""}`} title="Dark theme">
        <Moon size={13} strokeWidth={2} />
      </span>
    </button>
  );
}
