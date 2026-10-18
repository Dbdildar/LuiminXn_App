import {HOME, getCardWidth, getColumns, getTrendingCardWidth} from '../../../src/screens/Home/oldhomeConfig';

describe('getColumns', () => {
  it.each([
    [320, 2],
    [411, 2],
    [560, 3],
    [800, 4],
    [1024, 5],
  ])('%ipx -> %i columns', (w, cols) => {
    expect(getColumns(w)).toBe(cols);
  });
});

describe('getCardWidth', () => {
  it('fits columns, padding and gaps inside the screen', () => {
    for (const w of [320, 360, 411, 600, 820, 1100]) {
      const cols = getColumns(w);
      const used = getCardWidth(w, cols) * cols + HOME.grid.gap * (cols - 1) + HOME.grid.padding * 2;
      expect(used).toBeLessThanOrEqual(w);
      expect(w - used).toBeLessThan(cols);
    }
  });
});

describe('getTrendingCardWidth', () => {
  it('is clamped between min and max', () => {
    expect(getTrendingCardWidth(200)).toBe(HOME.trending.minWidth);
    expect(getTrendingCardWidth(411)).toBeGreaterThan(HOME.trending.minWidth);
    expect(getTrendingCardWidth(2000)).toBe(HOME.trending.maxWidth);
  });
});
