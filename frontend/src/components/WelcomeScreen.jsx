import { BookOpen, Code2, GraduationCap, MessageSquare, Sparkles } from "lucide-react";
import { BrandMark } from "./Brand.jsx";
import PromptSuggestions from "./PromptSuggestions.jsx";

export default function WelcomeScreen({ onPrompt, onModeChange }) {
  function handleSelectPrompt(prompt, mode) {
    if (mode && onModeChange) {
      onModeChange(mode);
    }
    onPrompt(prompt, mode);
  }

  return (
    <div className="welcome-screen">
      <div className="welcome-eyebrow">
        <span className="eyebrow-line" />
        <span>YOUR INTELLIGENT WORKSPACE</span>
        <span className="eyebrow-line" />
      </div>

      <div className="welcome-emblem">
        <BrandMark large />
      </div>

      <h1>What can I help you with?</h1>

      <p className="welcome-description">
        I’m Zenvora AI, your intelligent workspace. Whether you’re writing code,
        studying complex topics, polishing your resume, or preparing for interviews,
        I’m here to help.
      </p>

      <PromptSuggestions onSelectPrompt={handleSelectPrompt} />

      <div className="welcome-shortcuts">
        <span className="shortcuts-label">Explore specialized modes:</span>
        <button
          type="button"
          onClick={() => onModeChange("coding")}
          title="Switch to Coding Assistant"
        >
          <Code2 size={13} />
          <span>Coding assistant</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("study")}
          title="Switch to Study Assistant"
        >
          <BookOpen size={13} />
          <span>Study assistant</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("interview")}
          title="Switch to Interview Prep"
        >
          <GraduationCap size={13} />
          <span>Interview prep</span>
        </button>
        <button
          type="button"
          onClick={() => onModeChange("resume")}
          title="Switch to Resume Coach"
        >
          <MessageSquare size={13} />
          <span>Resume coach</span>
        </button>
      </div>

      <div className="welcome-footnote">
        <Sparkles size={13} />
        <span>Zenvora AI delivers thoughtful, step-by-step guidance tailored to your workflow.</span>
      </div>
    </div>
  );
}
