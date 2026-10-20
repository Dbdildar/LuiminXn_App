import {useQuery} from '@tanstack/react-query';
import {fetchRelated} from './videoApi';
import type {VideoItem} from './videoApi';

/** Similar videos for the one that is playing (series → actors → category). */
export function useRelatedVideos(video: VideoItem) {
  return useQuery({
    queryKey: ['videos', 'related', video.id],
    queryFn: () => fetchRelated(video),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
