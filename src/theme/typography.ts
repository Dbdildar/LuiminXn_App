import {Platform} from 'react-native';

/**
 * Android system font families are used so the app needs no font assets.
 * `sans-serif-light` for the wordmark letters, `sans-serif-black` for the
 * heavy neon "X". On other platforms (Jest, tooling) the default font is used.
 */
export const fonts = {
  light: Platform.select({android: 'sans-serif-light', default: undefined}),
  regular: Platform.select({android: 'sans-serif', default: undefined}),
  medium: Platform.select({android: 'sans-serif-medium', default: undefined}),
  black: Platform.select({android: 'sans-serif-black', default: undefined}),
};

export const fontSizes = {
  wordmark: 54,
  tagline: 15,
  body: 16,
  title: 26,
} as const;
