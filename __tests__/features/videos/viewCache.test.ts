import { QueryClient } from '@tanstack/react-query';
import { bumpViewsInCache, patchViews } from '../../../src/features/videos/viewCache';

const v = (id: string, views: number) => ({ id, views });

describe('viewCache', () => {
  it('updates infinite feed pages, trending and plain lists', () => {
    const qc = new QueryClient();
    qc.setQueryData(['feed'], { pages: [{ items: [v('a', 1), v('b', 2)], total: 2 }], pageParams: [0] });
    qc.setQueryData(['trending'], { items: [v('a', 1)] });
    qc.setQueryData(['related'], [v('a', 1), v('c', 3)]);

    bumpViewsInCache(qc, 'a', 9);

    expect((qc.getQueryData(['feed']) as any).pages[0].items[0].views).toBe(9);
    expect((qc.getQueryData(['feed']) as any).pages[0].items[1].views).toBe(2);
    expect((qc.getQueryData(['trending']) as any).items[0].views).toBe(9);
    expect((qc.getQueryData(['related']) as any)[0].views).toBe(9);
  });

  it('keeps the same reference when nothing changed (no needless re-render)', () => {
    const data = { items: [v('a', 1)] };
    expect(patchViews(data, 'zzz', 5)).toBe(data);
    expect(patchViews(data, 'a', 1)).toBe(data);
  });

  it('ignores unrelated cache entries', () => {
    const qc = new QueryClient();
    qc.setQueryData(['categories'], ['Action', 'Drama']);
    bumpViewsInCache(qc, 'a', 3);
    expect(qc.getQueryData(['categories'])).toEqual(['Action', 'Drama']);
  });
});
