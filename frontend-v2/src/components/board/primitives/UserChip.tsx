import type { CSSProperties } from "react";
import type { UserDetails } from "@/api/types";

// MockUser shape — extended UserDetails as documented in src/mock/users.ts.
// We accept either MockUser-with-hue or a bare UserDetails (in which case we hash).
export interface UserChipUser {
  id?: number | string;
  display_name: string;
  hue?: number;
  avatar?: string;
}

interface UserChipProps {
  user: UserChipUser | UserDetails;
  size?: number;
}

function hashHue(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Circular initial-based human avatar.
 * Hue from `user.hue` if present, otherwise hashed from display_name.
 */
export default function UserChip({ user, size = 22 }: UserChipProps) {
  const u = user as UserChipUser;
  const name = u.display_name || "Unknown";
  const hue = typeof u.hue === "number" ? u.hue : hashHue(name);
  const label = u.avatar || initials(name);

  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: size * 0.42,
    background: `oklch(0.7 0.13 ${hue})`,
    color: `oklch(0.25 0.05 ${hue})`,
    flex: "0 0 auto",
  };

  return (
    <span
      title={name}
      className="inline-flex select-none items-center justify-center rounded-full font-bold tracking-tight"
      style={style}
    >
      {label}
    </span>
  );
}
