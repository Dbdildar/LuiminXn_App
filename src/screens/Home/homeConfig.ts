/** Layout, timing and sizing for the Home screen. */
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
  grid: {padding: 16, gap: 12, cardAspect: 13 / 9},
  trending: {limit: 10, minWidth: 140, maxWidth: 200, widthRatio: 0.4, gap: 12},
  search: {debounceMs: 300},
  preview: {longPressMs: 350},
  skeleton: {grid: 8, categories: 5, trending: 4},
} as const;

export function getColumns(width: number): number {
  if (width >= 1000) {
    return 5;
  }
  if (width >= 800) {
    return 4;
  }
  if (width >= 560) {
    return 3;
  }
  return 2;
}

export function getCardWidth(screenWidth: number, columns: number): number {
  const {padding, gap} = HOME.grid;
  return Math.floor((screenWidth - padding * 2 - gap * (columns - 1)) / columns);
}

export function getTrendingCardWidth(screenWidth: number): number {
  const {minWidth, maxWidth, widthRatio} = HOME.trending;
  return Math.round(Math.min(maxWidth, Math.max(minWidth, screenWidth * widthRatio)));
}
