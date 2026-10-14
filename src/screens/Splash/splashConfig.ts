/**
 * Timeline for the LuminXn splash screen (all values in milliseconds).
 *
 *   0 ─ beam fades in
 * 500 ─ L u m i n rise in, one by one
 * 1200 ─ neon X ignites (flicker) then shivers and blinks forever
 * 1500 ─ final n appears
 * 2000 ─ tagline fades in
 * 3350 ─ whole screen fades out
 * 3800 ─ onFinish() is called
 */
export const SPLASH = {
  totalDuration: 3800,
  fadeOutDuration: 450,
  /** Used instead of the full show when "reduce motion" is on. */
  reducedMotionDuration: 1500,

  beam: {delay: 0, duration: 900},

  letters: {start: 500, stagger: 90, duration: 520, rise: 16},

  neonX: {
    igniteDelay: 1200,
    igniteDuration: 700,
    finalLetterDelay: 1500,
    /** Pause between two shiver bursts. */
    shiverPause: 1100,
    /** Pause between two blink bursts. */
    blinkPause: 1500,
    haloSize: 190,
  },

  tagline: {delay: 2000, duration: 700, text: 'Watch in full light'},

  loadingLine: {delay: 600, width: 160, height: 2},
} as const;

/** Letters before and after the neon X in "LuminXn". */
export const WORDMARK = {
  before: ['L', 'u', 'm', 'i', 'n'],
  accent: 'X',
  after: ['n'],
  label: 'LuminXn',
} as const;

/**
 * Fixed dust-mote positions (percent of screen) so the splash looks the same
 * on every launch and snapshots stay deterministic.
 */
export const DUST_MOTES: ReadonlyArray<{
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}> = [
  {x: 22, y: 30, size: 3, duration: 5200, delay: 0},
  {x: 31, y: 42, size: 2, duration: 4300, delay: 400},
  {x: 38, y: 24, size: 2, duration: 6100, delay: 900},
  {x: 46, y: 36, size: 4, duration: 5600, delay: 200},
  {x: 52, y: 28, size: 2, duration: 4700, delay: 1300},
  {x: 58, y: 44, size: 3, duration: 5900, delay: 600},
  {x: 64, y: 32, size: 2, duration: 4500, delay: 1000},
  {x: 70, y: 26, size: 3, duration: 6300, delay: 300},
  {x: 76, y: 40, size: 2, duration: 5100, delay: 1500},
  {x: 28, y: 52, size: 2, duration: 5800, delay: 700},
  {x: 43, y: 56, size: 3, duration: 4900, delay: 1100},
  {x: 61, y: 58, size: 2, duration: 5400, delay: 500},
];
