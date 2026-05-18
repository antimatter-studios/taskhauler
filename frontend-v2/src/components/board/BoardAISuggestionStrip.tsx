import { Sparkles } from "lucide-react";
import { MOCK_SUGGESTIONS } from "@/mock/suggestions";

/**
 * 28px tall strip — only renders if there are suggestions.
 * Apply/Dismiss buttons are wired to console.log placeholders.
 */
export default function BoardAISuggestionStrip() {
  const suggestions = MOCK_SUGGESTIONS || [];
  if (suggestions.length === 0) return null;
  const top = suggestions[0] as { id?: string; text?: string };

  return (
    <div
      className="flex items-center gap-2"
      style={{
        height: 28,
        padding: "0 14px",
        background: "linear-gradient(180deg, var(--accent-bg), var(--bg))",
        borderBottom: "1px solid var(--border)",
        fontSize: 11.5,
        flex: "0 0 28px",
      }}
    >
      <Sparkles size={12} style={{ color: "var(--accent)" }} />
      <span style={{ color: "var(--text-2)" }} className="truncate">
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>
          {suggestions.length} AI suggestions
        </span>
        {" — "}
        <span>{top?.text || ""}</span>
      </span>
      <button
        type="button"
        onClick={() => console.log("[suggestion] apply", top?.id)}
        className="ml-auto transition-opacity hover:opacity-90"
        style={{
          background: "var(--accent)",
          color: "var(--accent-fg)",
          fontSize: 11,
          fontWeight: 600,
          border: "none",
          borderRadius: 4,
          padding: "3px 8px",
          cursor: "pointer",
        }}
      >
        Apply
      </button>
      <button
        type="button"
        onClick={() => console.log("[suggestion] dismiss", top?.id)}
        className="transition-colors hover:text-[var(--text)]"
        style={{
          background: "transparent",
          color: "var(--text-2)",
          fontSize: 11,
          fontWeight: 500,
          border: "none",
          padding: "3px 6px",
          cursor: "pointer",
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
