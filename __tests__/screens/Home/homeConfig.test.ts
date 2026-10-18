import { HOME, getCardWidth, getColumns, getContentWidth } from '../../../src/screens/Home/homeConfig';

const WIDTHS = [280, 320, 360, 390, 430, 600, 768, 1024, 1280];

describe('homeConfig', () => {
  it.each(WIDTHS)('always uses 3 columns (width %i)', w => {
    expect(getColumns(w)).toBe(3);
  });

  it.each(WIDTHS)('3 cards + gaps + padding never exceed the content width (width %i)', w => {
    const card = getCardWidth(w);
    const used = card * 3 + HOME.grid.gap * 2 + HOME.grid.padding * 2;
    expect(used).toBeLessThanOrEqual(getContentWidth(w));
    expect(card).toBeGreaterThan(0);
  });

  it('caps content width on tablets / landscape', () => {
    expect(getContentWidth(1280)).toBe(HOME.grid.maxContentWidth);
    expect(getContentWidth(360)).toBe(360);
  });

  it('cards get wider as the phone gets wider', () => {
    expect(getCardWidth(430)).toBeGreaterThan(getCardWidth(320));
  });
});
