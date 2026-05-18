// Greedy row-packing for the Timeline view.
//
// Given a list of cards already projected to a horizontal axis (each has
// `x` and `width` in pixels), return the row index each card should occupy
// so that no two cards on the same row overlap. The algorithm is a classic
// "fewest tracks" greedy:
//
//   1. Sort by `x` ascending (ties broken by original index for stability).
//   2. For each card, pick the lowest-indexed row whose current right edge
//      (last placed card's x + width) is ≤ this card's x.
//   3. If no row fits, open a new row.
//
// The returned array has the same length as the input and preserves the
// caller's order — i.e. result[i] is the row for items[i].

interface Boxed {
  x: number;
  width: number;
}

export function packRows<T extends Boxed>(items: T[]): number[] {
  const n = items.length;
  if (n === 0) return [];

  // Sort indices by x asc, stable on original order.
  const order = items
    .map((it, i) => ({ i, x: it.x, w: it.width }))
    .sort((a, b) => (a.x - b.x) || (a.i - b.i));

  // rowEnds[r] = right edge of the last card placed on row r.
  const rowEnds: number[] = [];
  const out = new Array<number>(n);

  for (const { i, x, w } of order) {
    let placed = -1;
    for (let r = 0; r < rowEnds.length; r++) {
      if (rowEnds[r] <= x) {
        placed = r;
        break;
      }
    }
    if (placed === -1) {
      placed = rowEnds.length;
      rowEnds.push(0);
    }
    rowEnds[placed] = x + w;
    out[i] = placed;
  }

  return out;
}
