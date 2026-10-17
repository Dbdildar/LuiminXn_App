import {AppError} from '../../../src/lib/appError';
import {supabase} from '../../../src/lib/supabase';
import {
  PAGE_SIZE,
  fetchCategories,
  fetchVideoPage,
  resetVideoApiState,
} from '../../../src/features/videos/videoApi';
import {createBuilder} from '../../helpers/supabaseMock';

jest.mock('../../../src/lib/supabase', () => ({
  supabase: {from: jest.fn(), rpc: jest.fn()},
}));

const from = supabase.from as jest.Mock;
const rpc = supabase.rpc as jest.Mock;

const row = (n: number) => ({
  id: `id${n}`,
  title: `Title ${n}`,
  video_url: `https://v/${n}.mp4`,
  poster_uri: `https://p/${n}.jpg`,
  category: 'Action',
  actors: n === 2 ? null : ['A'],
  duration_seconds: n === 3 ? null : 90,
  views: n === 4 ? null : '1200',
});

const names = (b: {calls: Array<[string, unknown[]]>}, method: string) =>
  b.calls.filter(([m]) => m === method).map(([, args]) => args);

beforeEach(() => {
  resetVideoApiState();
  from.mockReset();
  rpc.mockReset();
});

describe('fetchVideoPage (metatable)', () => {
  it('maps rows, applying safe defaults', async () => {
    from.mockReturnValue(createBuilder({data: [row(1), row(2), row(3), row(4)], error: null, count: 4}));

    const page = await fetchVideoPage({});

    expect(page.items[0]).toEqual({
      id: 'id1',
      title: 'Title 1',
      videoUrl: 'https://v/1.mp4',
      poster: 'https://p/1.jpg',
      category: 'Action',
      actors: ['A'],
      durationSeconds: 90,
      views: 1200,
    });
    expect(page.items[1].actors).toEqual([]);
    expect(page.items[2].durationSeconds).toBe(0);
    expect(page.items[3].views).toBe(0);
  });

  it('computes nextOffset from the exact total', async () => {
    from.mockReturnValue(createBuilder({data: [row(1), row(2)], error: null, count: 5}));
    expect(await fetchVideoPage({offset: 0, limit: 2})).toMatchObject({total: 5, nextOffset: 2});

    from.mockReturnValue(createBuilder({data: [row(5)], error: null, count: 5}));
    expect(await fetchVideoPage({offset: 4, limit: 2})).toMatchObject({nextOffset: null});
  });

  it('requests the right range using the default page size', async () => {
    const b = createBuilder({data: [], error: null, count: 0});
    from.mockReturnValue(b);
    await fetchVideoPage({offset: 40});
    expect(names(b, 'range')).toEqual([[40, 40 + PAGE_SIZE - 1]]);
  });

  it('filters by category but not for "All"', async () => {
    const b1 = createBuilder({data: [], error: null, count: 0});
    from.mockReturnValue(b1);
    await fetchVideoPage({category: 'Action'});
    expect(names(b1, 'eq')).toEqual([['category', 'Action']]);

    const b2 = createBuilder({data: [], error: null, count: 0});
    from.mockReturnValue(b2);
    await fetchVideoPage({category: 'All'});
    expect(names(b2, 'eq')).toEqual([]);
  });

  it('searches every keyword (max 6) and escapes wildcards', async () => {
    const b = createBuilder({data: [], error: null, count: 0});
    from.mockReturnValue(b);
    await fetchVideoPage({search: '  Neon 100%_ night  '});
    expect(names(b, 'ilike')).toEqual([
      ['search_text', '%neon%'],
      ['search_text', '%100\\%\\_%'],
      ['search_text', '%night%'],
    ]);

    const many = createBuilder({data: [], error: null, count: 0});
    from.mockReturnValue(many);
    await fetchVideoPage({search: 'a b c d e f g h'});
    expect(names(many, 'ilike')).toHaveLength(6);
  });

  it('sorts by views for trending and by date otherwise', async () => {
    const trending = createBuilder({data: [], error: null, count: 0});
    from.mockReturnValue(trending);
    await fetchVideoPage({sort: 'views'});
    expect(names(trending, 'order')[0]).toEqual(['views', {ascending: false}]);

    const recent = createBuilder({data: [], error: null, count: 0});
    from.mockReturnValue(recent);
    await fetchVideoPage({});
    expect(names(recent, 'order')[0]).toEqual(['created_at', {ascending: true}]);
  });

  it('throws an AppError (and keeps using metatable) on a normal server error', async () => {
    from.mockReturnValue(createBuilder({data: null, error: {message: 'boom', code: '500'}, count: null}));
    await expect(fetchVideoPage({})).rejects.toBeInstanceOf(AppError);

    from.mockClear();
    from.mockReturnValue(createBuilder({data: [row(1)], error: null, count: 1}));
    await fetchVideoPage({});
    expect(from).toHaveBeenCalledWith('metatable');
  });

  it('turns a rejected request into a network AppError', async () => {
    from.mockReturnValue({
      select: () => ({
        order: () => ({
          order: () => ({range: () => Promise.reject(new TypeError('Network request failed'))}),
        }),
      }),
    });
    await expect(fetchVideoPage({})).rejects.toMatchObject({code: 'network'});
  });

  it('times out instead of hanging', async () => {
    jest.useFakeTimers();
    try {
      from.mockReturnValue({
        select: () => ({
          order: () => ({order: () => ({range: () => new Promise(() => {})})}),
        }),
      });
      const result = fetchVideoPage({});
      const timerPromise = jest.advanceTimersByTimeAsync(10_001);
  
      // ✅ Await the expect.rejects assertion directly inline
      await expect(result).rejects.toMatchObject({code: 'timeout'});
      await timerPromise;
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('fetchVideoPage (legacy fallback)', () => {
  const dramas = [
    {id: 'd1', title: 'Neon Nights', genre: 'Action • Thriller', image: 'img1'},
    {id: 'd2', title: 'Quiet Days', genre: 'Drama', image: 'img2'},
  ];
  const episodes = [
    {id: 'e1', drama_id: 'd1', number: 1, title: 'Pilot', duration: '1:30', video_url: 'u1', thumb: 't1'},
    {id: 'e2', drama_id: 'd2', number: 1, title: 'Begin', duration: '0:45', video_url: 'u2', thumb: null},
  ];

  function wireLegacy() {
    from.mockImplementation((table: string) => {
      if (table === 'metatable') {
        return createBuilder({data: null, error: {code: 'PGRST205', message: 'not in schema cache'}, count: null});
      }
      if (table === 'dramas') {
        return createBuilder({data: dramas, error: null});
      }
      return createBuilder({data: episodes, error: null});
    });
  }

  it('switches when the table is missing and still filters and searches', async () => {
    wireLegacy();

    const all = await fetchVideoPage({});
    expect(all.total).toBe(2);
    expect(all.items[0]).toMatchObject({id: 'e1', title: 'Neon Nights — Pilot', category: 'Action', durationSeconds: 90, poster: 't1'});
    expect(all.items[1].poster).toBe('img2');

    expect((await fetchVideoPage({category: 'Drama'})).items.map(v => v.id)).toEqual(['e2']);
    expect((await fetchVideoPage({search: 'neon pilot'})).items.map(v => v.id)).toEqual(['e1']);
    expect((await fetchVideoPage({search: 'nothing'})).items).toEqual([]);
  });

  it('does not query metatable again once it knows it is missing', async () => {
    wireLegacy();
    await fetchVideoPage({});
    from.mockClear();
    await fetchVideoPage({});
    expect(from).not.toHaveBeenCalledWith('metatable');
  });

  it('paginates and sorts by views', async () => {
    wireLegacy();
    const first = await fetchVideoPage({limit: 1});
    expect(first.nextOffset).toBe(1);
    const trending = await fetchVideoPage({sort: 'views'});
    expect(trending.items[0].views).toBeGreaterThanOrEqual(trending.items[1].views);
  });
});

describe('fetchCategories', () => {
  it('returns the categories from the list_categories RPC', async () => {
    rpc.mockReturnValue(createBuilder({data: [{category: 'Action'}, {category: ''}, {category: 'Drama'}], error: null}));
    expect(await fetchCategories()).toEqual(['Action', 'Drama']);
  });

  it('falls back to legacy data when the RPC is missing', async () => {
    rpc.mockReturnValue(createBuilder({data: null, error: {code: '42883', message: 'function does not exist'}}));
    from.mockImplementation((table: string) =>
      table === 'dramas'
        ? createBuilder({data: [{id: 'd1', title: 'X', genre: 'Romance'}], error: null})
        : createBuilder({data: [{id: 'e1', drama_id: 'd1', title: 'E', video_url: 'u'}], error: null}),
    );
    expect(await fetchCategories()).toEqual(['Romance']);
  });

  it('throws an AppError for other failures', async () => {
    rpc.mockReturnValue(createBuilder({data: null, error: {code: '500', message: 'boom'}}));
    await expect(fetchCategories()).rejects.toBeInstanceOf(AppError);
  });
});
