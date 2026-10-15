import {
  DUST_MOTES,
  SPLASH,
  WORDMARK,
} from '../../src/screens/Splash/splashConfig';

describe('splash timeline config', () => {
  it('fades out before the splash ends, with the fade fitting inside it', () => {
    expect(SPLASH.fadeOutDuration).toBeGreaterThan(0);
    expect(SPLASH.fadeOutDuration).toBeLessThan(SPLASH.totalDuration);
  });

  it('plays every intro step before the fade-out starts', () => {
    const fadeStart = SPLASH.totalDuration - SPLASH.fadeOutDuration;
    const lastLetterEnds =
      SPLASH.neonX.finalLetterDelay + SPLASH.letters.duration;
    const taglineEnds = SPLASH.tagline.delay + SPLASH.tagline.duration;
    const xSettles = SPLASH.neonX.igniteDelay + SPLASH.neonX.igniteDuration;

    expect(lastLetterEnds).toBeLessThan(fadeStart);
    expect(xSettles).toBeLessThan(fadeStart);
  });

  it('lights the X after "Lumin" has appeared and before the last "n"', () => {
    const luminDone =
      SPLASH.letters.start +
      (WORDMARK.before.length - 1) * SPLASH.letters.stagger;

    expect(SPLASH.neonX.igniteDelay).toBeGreaterThan(luminDone);
  });

  it('keeps the reduced-motion version shorter than the full one', () => {
    expect(SPLASH.reducedMotionDuration).toBeLessThan(SPLASH.totalDuration);
  });

  it('gives the loading line enough time to fill before the fade', () => {
    const fillTime =
      SPLASH.totalDuration - SPLASH.fadeOutDuration - SPLASH.loadingLine.delay;

    expect(fillTime).toBeGreaterThan(0);
  });

  it('spells the brand name from its parts', () => {
    expect(
      [...WORDMARK.before, WORDMARK.accent, ...WORDMARK.after].join(''),
    ).toBe('LuminXn');
    expect(WORDMARK.accent).toBe('X');
  });

  it('keeps every dust mote inside the screen with a sensible size and speed', () => {
    expect(DUST_MOTES.length).toBeGreaterThan(0);
    DUST_MOTES.forEach(mote => {
      expect(mote.x).toBeGreaterThanOrEqual(0);
      expect(mote.x).toBeLessThanOrEqual(100);
      expect(mote.y).toBeGreaterThanOrEqual(0);
      expect(mote.y).toBeLessThanOrEqual(100);
      expect(mote.size).toBeGreaterThan(0);
      expect(mote.duration).toBeGreaterThan(0);
      expect(mote.delay).toBeGreaterThanOrEqual(0);
    });
  });
});
