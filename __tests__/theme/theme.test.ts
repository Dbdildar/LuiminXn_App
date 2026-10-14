import {colors, fontSizes, fonts} from '../../src/theme';

describe('theme', () => {
  it('uses valid hex colours for every solid colour token', () => {
    const solid = Object.entries(colors).filter(([, v]) => v.startsWith('#'));

    expect(solid.length).toBeGreaterThan(0);
    solid.forEach(([name, value]) => {
      expect({name, ok: /^#[0-9A-F]{6}$/i.test(value)}).toEqual({
        name,
        ok: true,
      });
    });
  });

  it('defines the projector palette', () => {
    expect(colors.ink).toBe('#07050F');
    expect(colors.neon).toBe('#FF2E88');
    expect(colors.amber).toBe('#FFB454');
  });

  it('has positive font sizes', () => {
    Object.values(fontSizes).forEach(size => {
      expect(size).toBeGreaterThan(0);
    });
  });

  it('exposes all font roles used by the screens', () => {
    expect(Object.keys(fonts).sort()).toEqual([
      'black',
      'light',
      'medium',
      'regular',
    ]);
  });
});
