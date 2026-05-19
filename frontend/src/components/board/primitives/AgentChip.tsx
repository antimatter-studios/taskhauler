import type { CSSProperties } from "react";

interface AgentChipProps {
  name: string;
  size?: number;
  variant?: "default" | "terminal";
  /** Renders a cyan ring + glow when true (agent.status === "working"). */
  working?: boolean;
}

const PALETTES = {
  default: { bg: "#0f172a", fg: "#67e8f9", glow: "#22d3ee" },
  terminal: { bg: "#facc15", fg: "#1c1917", glow: "#fde047" },
} as const;

const HEX_CLIP = "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)";

/**
 * Hexagonal agent avatar — monospace single letter on a clipped tile.
 * Working agents get a cyan ring + faint glow.
 */
export default function AgentChip({
  name,
  size = 22,
  variant = "default",
  working = false,
}: AgentChipProps) {
  const palette = PALETTES[variant];
  const letter = (name?.[0] || "?").toUpperCase();

  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: size * 0.42,
    background: palette.bg,
    color: palette.fg,
    clipPath: HEX_CLIP,
    fontFamily: "var(--mono)",
    boxShadow: working
      ? `0 0 0 1px ${palette.glow}, 0 0 8px ${palette.glow}55`
      : "none",
    flex: "0 0 auto",
  };

  return (
    <span
      title={`@${name}`}
      className="inline-flex select-none items-center justify-center font-bold"
      style={style}
    >
      {letter}
    </span>
  );
}
