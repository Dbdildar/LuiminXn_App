import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {PAGE_SIZE, fetchCategories, fetchVideoPage} from './videoApi';

export function useVideoFeed({search, category}: {search: string; category: string}) {
  return useInfiniteQuery({
    queryKey: ['videos', search, category],
    initialPageParam: 0,
    queryFn: ({pageParam}) =>
      fetchVideoPage({search, category, offset: pageParam as number, limit: PAGE_SIZE}),
    getNextPageParam: last => last.nextOffset,
    staleTime: 30_000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });
}

export function useTrending(limit: number) {
  return useQuery({
    queryKey: ['trending', limit],
    queryFn: () => fetchVideoPage({limit, sort: 'views'}),
    staleTime: 5 * 60_000,
  });
}
