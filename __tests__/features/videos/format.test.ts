import { formatDuration, formatViews } from '../../../src/features/videos/format';

describe('format', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1500, '1.5K'],
    [2_500_000, '2.5M'],
    [3_100_000_000, '3.1B'],
    [NaN, '0'],
  ])('formatViews(%p) = %p', (n, out) => expect(formatViews(n as number)).toBe(out));

  it.each([
    [0, '0:00'],
    [125, '2:05'],
    [3725, '1:02:05'],
  ])('formatDuration(%p) = %p', (n, out) => expect(formatDuration(n)).toBe(out));
});
