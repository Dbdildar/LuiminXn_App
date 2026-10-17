import {formatDuration, formatViews} from '../../src/utils/format';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [-5, '0:00'],
    [NaN, '0:00'],
    [9, '0:09'],
    [75, '1:15'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
  ])('%p -> %p', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

describe('formatViews', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1.0K'],
    [12_500, '12.5K'],
    [2_000_000, '2.0M'],
    [3_400_000_000, '3.4B'],
    [-1, '0'],
    [NaN, '0'],
  ])('%p -> %p', (input, expected) => {
    expect(formatViews(input)).toBe(expected);
  });
});
