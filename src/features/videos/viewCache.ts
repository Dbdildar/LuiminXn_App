import type {QueryClient} from '@tanstack/react-query';

type AnyRecord = Record<string, any>;

function patchList(items: any[], id: string, views: number): any[] {
  let hit = false;
  const next = items.map(v => {
    if (v && v.id === id && v.views !== views) {
      hit = true;
      return {...v, views};
    }
    return v;
  });
  return hit ? next : items;
}

function patchPage(page: any, id: string, views: number) {
  if (!page || !Array.isArray(page.items)) return page;
  const items = patchList(page.items, id, views);
  return items === page.items ? page : {...page, items};
}

/** Returns the same reference when nothing changed, so React Query skips re-renders. */
export function patchViews(data: unknown, id: string, views: number): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return patchList(data, id, views);
  const d = data as AnyRecord;
  if (Array.isArray(d.pages)) {
    let changed = false;
    const pages = d.pages.map((p: any) => {
      const np = patchPage(p, id, views);
      if (np !== p) changed = true;
      return np;
    });
    return changed ? {...d, pages} : data;
  }
  return patchPage(d, id, views);
}

/** Pushes a new view count into every cached feed / trending / related list. */
export function bumpViewsInCache(queryClient: QueryClient, id: string, views: number) {
  queryClient.setQueriesData({predicate: () => true}, (old: unknown) => patchViews(old, id, views));
}
