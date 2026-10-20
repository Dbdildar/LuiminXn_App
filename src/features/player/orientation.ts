import Orientation from 'react-native-orientation-locker';

/** Thin wrapper so a missing/failed native call never crashes playback. */
export const screenOrientation = {
  lockLandscape() {
    try {
      Orientation.lockToLandscape();
    } catch {
      // ignore
    }
  },
  lockPortrait() {
    try {
      Orientation.lockToPortrait();
    } catch {
      // ignore
    }
  },
};
