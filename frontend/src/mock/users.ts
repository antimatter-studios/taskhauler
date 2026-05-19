// Will be replaced by GET /api/v1/users when endpoint exists.
//
// Mock user roster used to populate avatars, assignee dropdowns, and presence
// avatars. Hues come from the design spec — they drive UserChip colors via
// `oklch(0.7 0.13 <hue>)` for background and `oklch(0.25 0.05 <hue>)` for
// foreground.
//
// The current real user (from authStore) should be merged into this list at
// runtime by the consumer; we don't include them here so the mock list is
// deterministic regardless of who's logged in.

import type { UserDetails } from "../api/types";

export interface MockUser extends UserDetails {
  /** Stable display handle, e.g. "mira". Used in @mentions and console output. */
  handle: string;
  /** Two-letter initials shown inside the circular avatar chip. */
  avatar: string;
  /** Hue 0–360 — drives the avatar's oklch background + foreground. */
  hue: number;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 101,
    email: "mira@taskhauler.dev",
    display_name: "Mira Chen",
    handle: "mira",
    avatar: "MC",
    hue: 12,
  },
  {
    id: 102,
    email: "theo@taskhauler.dev",
    display_name: "Theo Park",
    handle: "theo",
    avatar: "TP",
    hue: 200,
  },
  {
    id: 103,
    email: "sana@taskhauler.dev",
    display_name: "Sana Bose",
    handle: "sana",
    avatar: "SB",
    hue: 290,
  },
  {
    id: 104,
    email: "jules@taskhauler.dev",
    display_name: "Jules Adler",
    handle: "jules",
    avatar: "JA",
    hue: 140,
  },
  {
    id: 105,
    email: "wren@taskhauler.dev",
    display_name: "Wren Ito",
    handle: "wren",
    avatar: "WI",
    hue: 40,
  },
];
