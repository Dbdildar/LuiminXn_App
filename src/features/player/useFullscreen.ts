import {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler} from 'react-native';
import {screenOrientation} from './orientation';

/** Fullscreen = same player stretched over the screen + rotate to landscape. */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ref = useRef(false);

  const enter = useCallback(() => {
    ref.current = true;
    screenOrientation.lockLandscape();
    setIsFullscreen(true);
  }, []);

  const exit = useCallback(() => {
    ref.current = false;
    screenOrientation.lockPortrait();
    setIsFullscreen(false);
  }, []);

  const toggle = useCallback(() => (ref.current ? exit() : enter()), [enter, exit]);

  // Android back button leaves fullscreen first instead of leaving the screen.
  useEffect(() => {
    if (!isFullscreen) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      exit();
      return true;
    });
    return () => sub.remove();
  }, [isFullscreen, exit]);

  // Never leave the app stuck in landscape.
  useEffect(
    () => () => {
      if (ref.current) screenOrientation.lockPortrait();
    },
    [],
  );

  return {isFullscreen, enter, exit, toggle};
}
