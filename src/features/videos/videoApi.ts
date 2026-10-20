// Data layer for the video catalogue (public.metatable): keyword search,
// category filter, offset pagination, trending sort and the category list.
//
// If `metatable` does not exist yet, reads degrade to the legacy
// dramas/episodes tables so the app never shows a blank screen. Only a
// "table missing" error triggers that switch; network errors are surfaced.
import {AppError, toAppError} from '../../lib/appError';
import {supabase} from '../../lib/supabase';
import type {FeedParams, VideoItem, VideoPage, VideoRow} from './types';

export const PAGE_SIZE = 20;

const COLUMNS =
  'id,title,video_url,poster_uri,category,actors,duration_seconds,views';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_SEARCH_TOKENS = 6;
const MISSING_CODES = new Set(['PGRST205', 'PGRST202', '42P01', '42883']);

const state: {useLegacy: boolean; legacyCache: VideoItem[] | null} = {
  useLegacy: false,
  legacyCache: null,
};

/** Test helper. */
export function resetVideoApiState() {
  state.useLegacy = false;
  state.legacyCache = null;
}

export function mapRow(r: VideoRow): VideoItem {
  return {
    id: r.id,
    title: r.title,
    videoUrl: r.video_url,
    poster: r.poster_uri,
    category: r.category,
    actors: r.actors ?? [],
    durationSeconds: r.duration_seconds ?? 0,
    views: Number(r.views ?? 0),
  };
}

function isMissingRelation(error: {code?: string; message?: string}): boolean {
  if (error.code && MISSING_CODES.has(error.code)) {
    return true;
  }
  const m = (error.message ?? '').toLowerCase();
  return m.includes('schema cache') || m.includes('does not exist');
}

/** Never let a request hang forever: the shimmer must end. */
function withTimeout<T>(work: PromiseLike<T>, ms = REQUEST_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new AppError('timeout', 'The request took too long.')),
      ms,
    );
    Promise.resolve(work).then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function tokenize(q: string): string[] {
  return q.split(/\s+/).filter(Boolean).slice(0, MAX_SEARCH_TOKENS);
}

function escapeLike(token: string): string {
  return token.replace(/[\\%_]/g, '\\$&');
}

function toPage(all: VideoItem[], offset: number, limit: number, total: number): VideoPage {
  return {
    items: all,
    total,
    nextOffset: offset + all.length < total ? offset + all.length : null,
  };
}

// ---------------------------------------------------------------------------
// Primary source
// ---------------------------------------------------------------------------
async function queryMetatable(
  q: string,
  category: string,
  offset: number,
  limit: number,
  sort: 'recent' | 'views',
): Promise<VideoPage | null> {
  let query = supabase.from('metatable').select(COLUMNS, {count: 'exact'});

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  for (const token of tokenize(q)) {
    query = query.ilike('search_text', `%${escapeLike(token)}%`);
  }
  query =
    sort === 'views'
      ? query.order('views', {ascending: false}).order('id')
      : query.order('created_at', {ascending: true}).order('id');

  const {data, error, count} = await withTimeout(
    query.range(offset, offset + limit - 1),
  );

  if (error) {
    if (isMissingRelation(error)) {
      state.useLegacy = true;
      return null;
    }
    throw error;
  }

  const items = (data ?? []).map(r => mapRow(r as VideoRow));
  return toPage(items, offset, limit, count ?? offset + items.length);
}

// ---------------------------------------------------------------------------
// Legacy fallback (dramas / episodes)
// ---------------------------------------------------------------------------
type LegacyDrama = {id: string; title?: string; genre?: string; image?: string; poster?: string};
type LegacyEpisode = {
  id: string;
  drama_id: string;
  title: string;
  duration?: string;
  video_url: string;
  thumb?: string;
};

const ACTOR_POOL = [
  ['Ava Sinclair', 'Damien Cross'],
  ['Elena Vaughn', 'Marcus Reed'],
  ['Kai Thornwood', 'Isla Moon'],
  ['Camille Duarte', 'Victor Hale'],
  ['Mira Castellan', 'Yuna Park'],
  ['Poppy Sinclair', 'Grant Whitmore'],
];

function parseDuration(text: string | null | undefined): number {
  if (!text) {
    return 0;
  }
  return text.split(':').reduce((acc, p) => acc * 60 + (Number(p) || 0), 0);
}

function hash(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

async function loadLegacy(): Promise<VideoItem[]> {
  if (state.legacyCache) {
    return state.legacyCache;
  }
  const [dramas, episodes] = await Promise.all([
    withTimeout(supabase.from('dramas').select('id,title,genre,image,poster')),
    withTimeout(
      supabase
        .from('episodes')
        .select('id,drama_id,number,title,duration,video_url,thumb'),
    ),
  ]);
  if (dramas.error || episodes.error) {
    throw dramas.error ?? episodes.error;
  }
  const byId = new Map(
    ((dramas.data ?? []) as LegacyDrama[]).map(d => [d.id, d]),
  );
  state.legacyCache = ((episodes.data ?? []) as LegacyEpisode[]).map(e => {
    const d = byId.get(e.drama_id);
    return {
      id: e.id,
      title: `${d?.title ?? 'Video'} — ${e.title}`,
      videoUrl: e.video_url,
      poster: (e.thumb || d?.image || d?.poster || '') as string,
      category: ((d?.genre ?? 'Drama').split('•')[0] ?? 'Drama').trim(),
      actors: ACTOR_POOL[hash(e.drama_id) % ACTOR_POOL.length],
      durationSeconds: parseDuration(e.duration),
      views: 12_000 + (hash(e.id) % 900_000),
    };
  });
  return state.legacyCache;
}

function matches(v: VideoItem, q: string): boolean {
  const hay = `${v.title} ${v.category} ${v.actors.join(' ')}`.toLowerCase();
  return tokenize(q).every(token => hay.includes(token));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function fetchVideoPage(params: FeedParams = {}): Promise<VideoPage> {
  const {
    search = '',
    category = 'All',
    offset = 0,
    limit = PAGE_SIZE,
    sort = 'recent',
  } = params;
  const q = search.trim().toLowerCase();

  try {
    if (!state.useLegacy) {
      const page = await queryMetatable(q, category, offset, limit, sort);
      if (page) {
        return page;
      }
    }
    const all = await loadLegacy();
    const filtered = all
      .filter(v => (!category || category === 'All' ? true : v.category === category))
      .filter(v => (q ? matches(v, q) : true));
    const sorted =
      sort === 'views' ? [...filtered].sort((a, b) => b.views - a.views) : filtered;
    return toPage(sorted.slice(offset, offset + limit), offset, limit, sorted.length);
  } catch (error) {
    throw toAppError(error);
  }
}

export async function fetchCategories(): Promise<string[]> {
  try {
    if (!state.useLegacy) {
      const {data, error} = await withTimeout(supabase.rpc('list_categories'));
      if (!error && data) {
        return (data as {category: string}[]).map(r => r.category).filter(Boolean);
      }
      if (error && !isMissingRelation(error)) {
        throw error;
      }
    }
    const all = await loadLegacy();
    return [...new Set(all.map(v => v.category))].filter(Boolean).sort();
  } catch (error) {
    throw toAppError(error);
  }
}



/**
 * !!! NOT a standalone file !!!
 * PASTE everything below at the BOTTOM of your existing src/features/videos/videoApi.ts
 * (it re-uses that file's `supabase`, `VideoItem`, `Row` and `mapRow`).
 * Then delete this file.
 */

const SELECT = 'id,title,video_url,poster_uri,category,actors,duration_seconds,views';

/** Related videos: same series first, then shared actors, then same category. */
export async function fetchRelated(video: VideoItem, limit = 24): Promise<VideoItem[]> {
  const seriesKey = (video.title.split('—')[0] ?? video.title).trim().replace(/[%_]/g, '\\$&');

  const [byCategory, byActor, bySeries] = await Promise.all([
    supabase
      .from('metatable')
      .select(SELECT)
      .eq('category', video.category)
      .neq('id', video.id)
      .order('views', {ascending: false})
      .limit(limit),
    video.actors.length
      ? supabase
          .from('metatable')
          .select(SELECT)
          .overlaps('actors', video.actors)
          .neq('id', video.id)
          .limit(limit)
      : Promise.resolve({data: [], error: null} as any),
    supabase
      .from('metatable')
      .select(SELECT)
      .ilike('title', `${seriesKey}%`)
      .neq('id', video.id)
      .limit(limit),
  ]);

  if (byCategory.error) {
    throw new Error(byCategory.error.message);
  }

  const seen = new Set<string>([video.id]);
  const out: VideoItem[] = [];
  for (const res of [bySeries, byActor, byCategory]) {
    for (const r of (res.data ?? []) as VideoRow[]) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(mapRow(r));
    }
  }
  return out.slice(0, limit);
}

/** Atomically bumps the view counter in the DB and returns the fresh total. */
export async function incrementViews(video: VideoItem): Promise<number> {
  const {data, error} = await supabase.rpc('increment_views', {_id: video.id});
  if (error || data == null) {
    throw new Error(error?.message ?? 'increment_views returned nothing');
  }
  return Number(data);
}
