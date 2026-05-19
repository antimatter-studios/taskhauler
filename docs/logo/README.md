# Taskhauler brand

The Taskhauler mark is a **three-card stack rising forward and upward** — tasks being hauled through a workflow. The depth (three offset rounded rectangles in graduated indigo) reads as motion and a sense of work-in-progress; the small accent lines on the front card hint at the card content (title + meta). A live-green pin at the top-right corner of the active card signals "live agents working right now."

## Files

| File | Use |
|---|---|
| `icon.svg` | Primary 32×32 mark. Full color stack with gradient highlight and live indicator. Scales cleanly from 16 → 512 px. |
| `mark.svg` | Single-color version of the three-card stack with `fill="currentColor"`. Drop into any colored foreground. |
| `icon-mono.svg` | Plate-with-content variant in `currentColor`. Useful when you want the brand color set by parent (CSS `color` property). |
| `wordmark.svg` | Icon + "Taskhauler" wordmark in a single 200×48 SVG. Wordmark uses `currentColor`. |

## Why a card stack and not a literal TH monogram?

A monogram is a name. A mark is a *meaning.* Taskhauler is about pushing work forward — cards moving through columns, humans and agents pulling them across the board. Three offset cards say all of that without needing typography.

The design also scales much better than thin letterforms. At 16 px a TH monogram becomes mush; three stacked rectangles stay legible as a stack of "things."

## Design notes

- **Geometry**: three 16×16 rounded squares (`rx=2.5`) offset by 4.5px each on both axes. Diagonal rise reads as forward motion.
- **Depth**: back card is the deepest indigo (`#3939a8`), middle is mid-tone (`#5b5bd6`), front uses a subtle gradient (`#7e7df0 → #5b5bd6`) to feel like the most recently-touched card.
- **Card lines**: three muted white strips on the front card mimic a card title + 2 meta lines. The mark reads as "a kanban card on top of two more kanban cards."
- **Live pin**: a 2.6px live-green dot in a thin dark ring at the top-right of the front card. At 16 px it becomes a single bright pixel; at large sizes it's a clear "active" indicator.
- **Palette**:
  - Deep indigo: `#3939a8`
  - Primary indigo: `#5b5bd6`
  - Bright indigo (gradient top): `#7e7df0`
  - Live green: `#84cc16`
  - Dark ring: `#0c0c11`

## Adapting

The SVG is plain primitives — rects with rounded corners and two circles. You can:

- Recolor by editing the three `fill` values on the cards (the gradient is defined in `<defs>`).
- Remove the live indicator by deleting the two `<circle>` tags.
- Tighten the stack by reducing the 4.5px offset (change `x="7.5"` and `x="12"` proportionally).
- Use the mark on a colored plate by wrapping it in a `<rect>` background, or use `mark.svg` which is just the glyph.
