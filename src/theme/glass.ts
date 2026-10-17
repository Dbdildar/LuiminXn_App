import {colors} from './index';

/**
 * Every colour the new Home / Detail / Offline screens use that is NOT already
 * in the app theme. Compare with the design screenshot and adjust HERE only.
 */
export const glass = {
  surface: 'rgba(255,255,255,0.06)',
  surfaceStrong: 'rgba(255,255,255,0.12)',
  border: 'rgba(255,255,255,0.14)',
  borderStrong: 'rgba(255,255,255,0.28)',
  highlight: 'rgba(255,255,255,0.32)',
  header: 'rgba(14,10,28,0.86)',
  scrim: 'rgba(0,0,0,0.85)',
  shadow: '#000000',
} as const;

/** Logo colours copied from the reference GlassHeader (fuchsia-500 / violet-600 / cyan-500). */
export const brand = {
  fuchsia: '#d946ef',
  violet: '#7c3aed',
  cyan: '#06b6d4',
  cyanLight: '#22d3ee',
  cyanSoft: '#67e8f9',
} as const;

export const palette = {
  background: colors.ink,
  card: colors.dusk,
  accent: colors.neon,
  text: colors.filament,
  textMuted: colors.mist,
} as const;
