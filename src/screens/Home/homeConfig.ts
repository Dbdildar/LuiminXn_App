/**
 * KEEP your existing values for header / search / skeleton; the numbers here are
 * placeholders. The new keys are grid.columns, grid.maxContentWidth,
 * trending.minVisible, preview.touchDelayMs and categories.rows.
 */
export const HOME = {
  header: {
    logoRowHeight: 56,
    searchHeight: 48,
    collapsedSize: 44,
    collapsedHeight: 56,
    expandedHeight: 120,
    horizontalPadding: 16,
    /** Scroll offset (px) after which the search bar turns into an icon. */
    collapseAt: 48,
    /** Scroll offset (px) below which it expands again (gap avoids flicker). */
    expandAt: 8,
    animationMs: 280,
  },

  grid: { columns: 3, gap: 8, padding: 12, maxContentWidth: 960, cardAspect: 13 / 9 },
  //header: { expandedHeight: 132, expandAt: 12, collapseAt: 80 },
  search: { debounceMs: 350 },
  trending: { limit: 10, minVisible: 3, minWidth: 140, maxWidth: 200, widthRatio: 0.4, gap: 12 },
  skeleton: { grid: 8, categories: 5, trending: 4 },
  preview: { touchDelayMs: 90, longPressMs: 50 },
  categories: { rows: 2 },
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



export function getTrendingCardWidth(screenWidth: number): number {
  const { minWidth, maxWidth, widthRatio } = HOME.trending;
  return Math.round(Math.min(maxWidth, Math.max(minWidth, screenWidth * widthRatio)));
}
