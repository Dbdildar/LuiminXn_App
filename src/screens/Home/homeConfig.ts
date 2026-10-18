/**
 * KEEP your existing values for header / search / skeleton; the numbers here are
 * placeholders. The new keys are grid.columns, grid.maxContentWidth,
 * trending.minVisible, preview.touchDelayMs and categories.rows.
 */
export const HOME = {
  grid: {columns: 3, gap: 8, padding: 12, maxContentWidth: 960},
  header: {expandedHeight: 132, expandAt: 12, collapseAt: 80},
  search: {debounceMs: 350},
  trending: {limit: 10, minVisible: 3},
  skeleton: {categories: 6},
  preview: {touchDelayMs: 90},
  categories: {rows: 2},
} as const;

/** On tablets / landscape the content is centred and capped so cards stay a sane size. */
export function getContentWidth(width: number) {
  return Math.min(width, HOME.grid.maxContentWidth);
}

/** Always 3 per row, on every device. */
export function getColumns(_width: number) {
  return HOME.grid.columns;
}

/** Exact card width so `columns` cards + gaps + side padding always fit. */
export function getCardWidth(width: number, columns: number = HOME.grid.columns) {
  const usable =
    getContentWidth(width) - HOME.grid.padding * 2 - HOME.grid.gap * (columns - 1);
  return Math.max(Math.floor(usable / columns), 72);
}
