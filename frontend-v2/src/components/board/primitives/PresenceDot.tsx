import type { CSSProperties } from "react";

interface PresenceDotProps {
  color: string;
  active?: boolean;
}

/**
 * 7×8px circle anchored bottom-right of its positioned parent.
 * Pulses when `active`.
 */
export default function PresenceDot({ color, active = true }: PresenceDotProps) {
  const style: CSSProperties = {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 7,
    height: 8,
    borderRadius: 99,
    background: color,
    boxShadow: "0 0 0 1.5px var(--surface)",
    animation: active ? "presence-pulse 1.6s ease-in-out infinite" : undefined,
    pointerEvents: "none",
  };

  return <span style={style} aria-hidden="true" />;
}
