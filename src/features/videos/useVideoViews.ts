import {useQueryClient} from '@tanstack/react-query';
import {useCallback, useEffect, useRef, useState} from 'react';
import {incrementViews} from './videoApi';
import type {VideoItem} from './videoApi';
import {bumpViewsInCache} from './viewCache';

/**
 * View counter for the playing video.
 * recordView(): +1 on screen and in the Home/Trending cache INSTANTLY,
 * then writes to the database and reconciles with the real total.
 */
export function useVideoViews(video: VideoItem) {
  const queryClient = useQueryClient();
  const [views, setViews] = useState(video.views);
  const viewsRef = useRef(video.views);
  const activeId = useRef(video.id);

  useEffect(() => {
    activeId.current = video.id;
    viewsRef.current = video.views;
    setViews(video.views);
    // only reset when the video itself changes, not on every views update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  const recordView = useCallback(async () => {
    const id = video.id;
    const optimistic = viewsRef.current + 1;
    viewsRef.current = optimistic;
    setViews(optimistic);
    bumpViewsInCache(queryClient, id, optimistic);

    try {
      const fresh = await incrementViews(video);
      if (!Number.isFinite(fresh)) return;
      bumpViewsInCache(queryClient, id, fresh);
      if (activeId.current === id) {
        viewsRef.current = fresh;
        setViews(fresh);
      }
    } catch {
      // network / RPC failure: keep the optimistic number, the DB is retried next play
    }
  }, [queryClient, video]);

  return {views, recordView};
}
