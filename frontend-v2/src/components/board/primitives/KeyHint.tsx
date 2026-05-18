import type { ReactNode } from "react";

interface KeyHintProps {
  children: ReactNode;
}

/**
 * Small inline kbd label, used as a hint next to buttons (e.g. "C" / "⌘K").
 */
export default function KeyHint({ children }: KeyHintProps) {
  return (
    <kbd
      className="inline-flex items-center justify-center px-1 leading-none"
      style={{
        fontFamily: "var(--mono)",
        fontSize: 10,
        height: 16,
        minWidth: 16,
        color: "var(--text-2)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderBottomWidth: 2,
        borderRadius: 3,
      }}
    >
      {children}
    </kbd>
  );
}
