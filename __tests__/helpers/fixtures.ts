import type {VideoItem, VideoPage} from '../../src/features/videos';

export function makeVideo(n: number, overrides: Partial<VideoItem> = {}): VideoItem {
  return {
    id: `v${n}`,
    title: `Video ${n}`,
    videoUrl: `https://cdn.test/v${n}.mp4`,
    poster: `https://cdn.test/v${n}.jpg`,
    category: n % 2 === 0 ? 'Action' : 'Drama',
    actors: [`Actor ${n}`],
    durationSeconds: 60 + n,
    views: 1000 * n,
    ...overrides,
  };
}

export function makePage(
  items: VideoItem[],
  extra: Partial<VideoPage> = {},
): VideoPage {
  return {items, total: items.length, nextOffset: null, ...extra};
}
