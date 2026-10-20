export const PLAYER = {
  seekStepSeconds: 10,
  holdRate: 3,
  speeds: [0.5, 0.75, 1, 1.25, 1.5, 2] as readonly number[],
  controlsHideMs: 4000,
  doubleTapMs: 280,
  holdMs: 350,
  viewQualifySeconds: 5,
  progressIntervalMs: 250,
  stallMs: 8000, // buffering longer than this shows "Slow connection"
  seekTimeoutMs: 8000, // safety: never leave the seek loader on forever
  accent: '#E50914', // Netflix red
} as const;

export type Zone = 'left' | 'center' | 'right';

export const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** 65 -> "1:05", 3723 -> "1:02:03" */
export function formatClock(t: number) {
  if (!Number.isFinite(t) || t < 0) return '0:00';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Left 35% / right 35% are seek zones, the middle toggles the controls. */
export function zoneFromX(x: number, width: number): Zone {
  if (width <= 0) return 'center';
  const r = x / width;
  return r < 0.35 ? 'left' : r > 0.65 ? 'right' : 'center';
}

/** 16:9, but never taller than 60% of the screen (landscape phones, tablets). */
export function getPlayerHeight(width: number, height: number) {
  return Math.round(Math.min((width * 9) / 16, height * 0.6));
}
