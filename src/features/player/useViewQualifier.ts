import {useCallback, useEffect, useRef} from 'react';
import {PLAYER} from './playerConfig';

/**
 * Counts seconds of REAL playback (seeks / scrubbing are ignored) and calls
 * `onQualified` once after `threshold` seconds.
 */
export function useViewQualifier(
  videoId: string,
  onQualified: () => void,
  threshold: number = PLAYER.viewQualifySeconds,
) {
  const watched = useRef(0);
  const last = useRef<number | null>(null);
  const counted = useRef(false);
  const cb = useRef(onQualified);
  cb.current = onQualified;

  useEffect(() => {
    watched.current = 0;
    last.current = null;
    counted.current = false;
  }, [videoId]);

  const tick = useCallback(
    (currentTime: number, playing: boolean) => {
      const prev = last.current;
      last.current = currentTime;
      if (prev === null || !playing) return;
      const delta = currentTime - prev;
      if (delta > 0 && delta < 1.5) watched.current += delta;
      if (!counted.current && watched.current >= threshold) {
        counted.current = true;
        cb.current();
      }
    },
    [threshold],
  );

  /** Call after a seek so the jump is not counted as watch time. */
  const markSeek = useCallback(() => {
    last.current = null;
  }, []);

  return {tick, markSeek};
}
