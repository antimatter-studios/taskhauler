// Theme registry + persistence.
//
// The three palettes themselves are declared in src/index.css under
// `:root[data-theme="..."]`. This module is just the JS-side glue:
//   • applyTheme()    — write data-theme attribute on <html>
//   • getStoredTheme  — read last user choice from localStorage
//   • persistTheme    — write user choice to localStorage
//
// LocalStorage key: "taskhauler.theme".

export type ThemeName = "day" | "mono" | "paper";

export const THEMES: ThemeName[] = ["day", "mono", "paper"];

const STORAGE_KEY = "taskhauler.theme";
const DEFAULT_THEME: ThemeName = "day";

function isThemeName(v: unknown): v is ThemeName {
  return v === "day" || v === "mono" || v === "paper";
}

/** Sets `data-theme="<name>"` on the document root. Safe in SSR (no-ops). */
export function applyTheme(name: ThemeName): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", name);
}

/** Reads the persisted theme. Returns "day" when missing or invalid. */
export function getStoredTheme(): ThemeName {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isThemeName(raw)) return raw;
  } catch {
    // localStorage might throw in private mode — fall through to default.
  }
  return DEFAULT_THEME;
}

/** Writes the user's theme choice to localStorage. */
export function persistTheme(name: ThemeName): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {
    // Ignore quota / private-mode errors.
  }
}
