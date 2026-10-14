/**
 * LuminXn colour tokens.
 *
 * Concept: a projector in a dark room. Deep ink background, a warm amber beam,
 * thin filament-white lettering and one neon magenta "X" as the memorable element.
 */
export const colors = {
  ink: '#07050F',
  dusk: '#1B1040',
  filament: '#FFF1E0',
  neon: '#FF2E88',
  neonSoft: '#FF7AB6',
  amber: '#FFB454',
  mist: '#A79BD1',
  track: 'rgba(255, 241, 224, 0.12)',
} as const;

export type ColorToken = keyof typeof colors;
