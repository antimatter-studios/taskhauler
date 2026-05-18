// Position helpers for ordered list mutations (cards in a column, columns in a
// board, etc.). Mirrors the convention used by the v1 KanbanBoard:
//
//   • Empty list                → 1000
//   • Append after last         → lastPos + 1000
//   • Insert before first       → firstPos - 1000
//   • Insert between i-1 and i  → midpoint of the two neighbours
//
// Using floats and midpoint splits means we (almost) never have to renumber
// the list — there's always room between two existing positions.

interface Positioned {
  position: number;
}

/**
 * Returns a position value that places a new item **after** every existing
 * item. For an empty list, returns 1000.
 */
export function positionAfter(items: Positioned[]): number {
  if (items.length === 0) return 1000;
  const last = items[items.length - 1];
  return last.position + 1000;
}

/**
 * Returns a position value that places a new item **before** the item at
 * `idx`. Indices:
 *   • idx === 0                → firstPos - 1000
 *   • idx === items.length     → positionAfter(items)
 *   • else                     → midpoint of items[idx-1] and items[idx]
 *
 * If items is empty, returns 1000.
 */
export function positionBefore(items: Positioned[], idx: number): number {
  if (items.length === 0) return 1000;
  if (idx <= 0) return items[0].position - 1000;
  if (idx >= items.length) return positionAfter(items);
  return (items[idx - 1].position + items[idx].position) / 2;
}
