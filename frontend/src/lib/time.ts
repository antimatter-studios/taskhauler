// Time formatting helpers used across the UI.
//
// All functions take Unix timestamps in **milliseconds** (matching the rest of
// the codebase — see api/types.ts). Pass `Date.now()`-style values, not
// seconds.

const MS_PER_DAY = 86_400_000;

export interface DueInfo {
  /** Display text. Empty string when no timestamp was provided. */
  txt: string;
  /** True when the due date is strictly in the past. */
  overdue: boolean;
  /** True when the due date is within the next 2 days and not overdue. */
  soon: boolean;
}

/**
 * Returns relative due-date display info.
 *
 * Buckets:
 *   • overdue:           "Nd ago"           (overdue=true)
 *   • today:             "today"            (soon=true)
 *   • tomorrow / Nd:     "in 2d"            (soon = N <= 2)
 *   • this week:         "Mon 12"           (weekday + day)
 *   • beyond:            "Feb 3"            (month + day)
 *   • null/undefined:    "" (txt empty, both flags false)
 */
export function fmtDue(timestamp: number | null | undefined): DueInfo {
  if (timestamp === null || timestamp === undefined || Number.isNaN(timestamp)) {
    return { txt: "", overdue: false, soon: false };
  }

  const now = Date.now();
  const diffMs = timestamp - now;
  const days = Math.round(diffMs / MS_PER_DAY);
  const dt = new Date(timestamp);

  if (days < 0) {
    const n = -days;
    return { txt: `${n}d ago`, overdue: true, soon: false };
  }
  if (days === 0) {
    return { txt: "today", overdue: false, soon: true };
  }
  if (days <= 2) {
    return { txt: `in ${days}d`, overdue: false, soon: true };
  }
  if (days < 7) {
    const weekday = dt.toLocaleDateString(undefined, { weekday: "short" });
    return { txt: `${weekday} ${dt.getDate()}`, overdue: false, soon: false };
  }
  const monthDay = dt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return { txt: monthDay, overdue: false, soon: false };
}

/**
 * Short relative "ago" string. Always returns one of: "Ns" | "Nm" | "Nh" | "Nd".
 * Negative deltas (timestamp in the future) collapse to "0s".
 */
export function fmtAgo(timestamp: number): string {
  const diff = Math.max(0, Date.now() - timestamp);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

/**
 * Absolute date string suitable for tooltips. Example: "Feb 3, 2026, 2:30 PM".
 */
export function fmtDate(timestamp: number): string {
  const dt = new Date(timestamp);
  return dt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
