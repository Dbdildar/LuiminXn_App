import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import { useVideoViews } from '../../../src/features/videos/useVideoViews';
import { makeVideo } from '../../helpers/fixtures';

jest.mock('../../../src/features/videos/videoApi', () => ({
  PAGE_SIZE: 20,
  fetchVideoPage: jest.fn(),
  fetchCategories: jest.fn(),
  fetchRelated: jest.fn(),
  incrementViews: jest.fn(),
}));
import { incrementViews } from '../../../src/features/videos/videoApi';

const inc = incrementViews as jest.Mock;
const video = makeVideo(1, { views: 10 }) as any;

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  qc.setQueryData(['feed'], { pages: [{ items: [{ id: video.id, views: 10 }] }], pageParams: [0] });
  const wrapper = ({ children }: any) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  const hook = renderHook(() => useVideoViews(video), { wrapper });
  return { qc, ...hook };
}

beforeEach(() => inc.mockReset());

describe('useVideoViews', () => {
  it('starts from the video views', () => {
    expect(setup().result.current.views).toBe(10);
  });

  it('adds 1 instantly (UI + Home cache) before the database answers', () => {
    let resolve: (n: number) => void = () => {};
    inc.mockReturnValue(new Promise<number>(r => (resolve = r)));
    const { result, qc } = setup();
    act(() => {
      void result.current.recordView();
    });
    expect(result.current.views).toBe(11);
    expect((qc.getQueryData(['feed']) as any).pages[0].items[0].views).toBe(11);
    expect(inc).toHaveBeenCalledWith(video);
    resolve(11);
  });

  it('reconciles with the real total from the database', async () => {
    inc.mockResolvedValue(150);
    const { result, qc } = setup();
    await act(async () => {
      await result.current.recordView();
    });
    expect(result.current.views).toBe(150);
    expect((qc.getQueryData(['feed']) as any).pages[0].items[0].views).toBe(150);
  });

  it('keeps the optimistic number if the database call fails', async () => {
    inc.mockRejectedValue(new Error('offline'));
    const { result } = setup();
    await act(async () => {
      await result.current.recordView();
    });
    expect(result.current.views).toBe(11);
  });
});
