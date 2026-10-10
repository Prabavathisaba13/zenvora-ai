import { ArrowUpRight, Code2, Coffee, FileText, UserCheck } from "lucide-react";

export const PROMPTS = [
  {
    id: "concept",
    icon: Code2,
    category: "Coding & Concepts",
    title: "Explain a programming concept",
    prompt: "Explain how hashing and hash collisions work in data structures, comparing chaining with open addressing with clear examples.",
    mode: "coding",
  },
  {
    id: "java",
    icon: Coffee,
    category: "Java Programming",
    title: "Help me write Java code",
    prompt: "Help me write clean, efficient Java code to implement a thread-safe LRU Cache with step-by-step logic and time complexity.",
    mode: "coding",
  },
  {
    id: "resume",
    icon: FileText,
    category: "Resume & Career",
    title: "Improve my resume",
    prompt: "Help me review and improve my resume bullet points for a software engineering position to make them action-oriented and metric-driven.",
    mode: "resume",
  },
  {
    id: "interview",
    icon: UserCheck,
    category: "Interview Prep",
    title: "Prepare me for an interview",
    prompt: "Prepare me for a software developer interview. Ask me one technical or behavioral question at a time and give constructive feedback.",
    mode: "interview",
  },
];

export default function PromptSuggestions({ onSelectPrompt }) {
  return (
    <div className="prompt-grid" aria-label="Suggested prompt cards">
      {PROMPTS.map(({ id, icon: Icon, category, title, prompt, mode }, index) => (
        <button
          key={id}
          type="button"
          className="prompt-card"
          onClick={() => onSelectPrompt(prompt, mode)}
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <span className="prompt-icon" aria-hidden="true">
            <Icon size={18} strokeWidth={1.9} />
          </span>
          <div className="prompt-content">
            <span className="prompt-category">{category}</span>
            <strong className="prompt-label">{title}</strong>
          </div>
          <ArrowUpRight className="prompt-arrow" size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
