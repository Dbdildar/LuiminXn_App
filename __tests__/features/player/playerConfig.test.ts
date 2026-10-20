import { clamp, formatClock, getPlayerHeight, zoneFromX } from '../../../src/features/player/playerConfig';

describe('playerConfig', () => {
  it('clamp keeps a value inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it.each([
    [0, '0:00'],
    [5, '0:05'],
    [65, '1:05'],
    [600, '10:00'],
    [3723, '1:02:03'],
    [NaN, '0:00'],
    [-4, '0:00'],
  ])('formatClock(%p) = %p', (input, out) => {
    expect(formatClock(input as number)).toBe(out);
  });

  it('zoneFromX splits left / centre / right', () => {
    expect(zoneFromX(10, 400)).toBe('left');
    expect(zoneFromX(200, 400)).toBe('center');
    expect(zoneFromX(390, 400)).toBe('right');
    expect(zoneFromX(10, 0)).toBe('center');
  });

  it('getPlayerHeight is 16:9 but capped at 60% of the screen', () => {
    expect(getPlayerHeight(360, 800)).toBe(203);
    expect(getPlayerHeight(800, 360)).toBe(216); // landscape phone
  });
});
