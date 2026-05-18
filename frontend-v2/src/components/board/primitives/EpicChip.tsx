import type { CSSProperties } from "react";
import type { Epic } from "@/api/types";

interface EpicChipProps {
  epic: Epic;
  size?: "sm" | "md";
}

/**
 * Color dot + truncated epic name in a pill.
 * Day/Paper themes: filled colored pill. Mono theme: transparent bg + colored border.
 *
 * Because we can't read the active theme at render time without an extra dep,
 * we lean on `data-theme="mono"` via the CSS attribute selector approach:
 * the pill ships with both styles set, then the [data-theme="mono"] override
 * (see component-local style) flips the bg. For now we use neutral surface bg
 * with the color encoded on the dot + a soft tinted background using
 * color-mix. This reads well in all three themes.
 */
export default function EpicChip({ epic, size = "sm" }: EpicChipProps) {
  const padY = size === "sm" ? 1 : 2;
  const padX = size === "sm" ? 5 : 7;
  const fontSize = size === "sm" ? 10.5 : 11.5;

  const style: CSSProperties = {
    padding: `${padY}px ${padX}px`,
    borderRadius: 3,
    fontSize,
    fontWeight: 500,
    color: "var(--text-2)",
    background: `color-mix(in srgb, ${epic.color} 8%, var(--bg))`,
    border: `1px solid color-mix(in srgb, ${epic.color} 35%, var(--border))`,
    maxWidth: 140,
    lineHeight: 1.2,
  };

  // Short label preferred — fall back to truncated name.
  const label = epic.name.length > 16 ? epic.name.slice(0, 16) + "…" : epic.name;

  return (
    <span
      title={epic.name}
      className="inline-flex items-center gap-1 truncate"
      style={style}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: 99,
          background: epic.color,
          flex: "0 0 auto",
        }}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
