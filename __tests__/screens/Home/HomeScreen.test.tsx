import { Dimensions, FlatList, ScrollView } from 'react-native';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { AppError } from '../../../src/lib/appError';
import { HomeScreen } from '../../../src/screens/Home';
import { getCardWidth } from '../../../src/screens/Home/homeConfig';
import { makePage, makeVideo } from '../../helpers/fixtures';
import { previewMock } from '../../helpers/previewMock';
import { renderWithProviders } from '../../helpers/renderWithProviders';

jest.mock('../../../src/features/videos/videoApi', () => ({
  PAGE_SIZE: 20,
  fetchVideoPage: jest.fn(),
  fetchCategories: jest.fn(),
}));

import { fetchCategories, fetchVideoPage } from '../../../src/features/videos/videoApi';

const feedMock = fetchVideoPage as jest.Mock;
const categoriesMock = fetchCategories as jest.Mock;

const trendingVideos = [
  makeVideo(10, { title: 'Trend Ten' }),
  makeVideo(11, { title: 'Trend Eleven' }),
  makeVideo(12, { title: 'Trend Twelve' }),
  makeVideo(13, { title: 'Trend Thirteen' }),
];
const feedVideos = [makeVideo(1), makeVideo(2), makeVideo(3)];

function defaultApi() {
  categoriesMock.mockResolvedValue(['Action', 'Drama', 'Comedy']);
  feedMock.mockImplementation(async (p: any) =>
    p.sort === 'views' ? makePage(trendingVideos) : makePage(feedVideos),
  );
}

beforeEach(() => {
  feedMock.mockReset();
  categoriesMock.mockReset();
  previewMock.reset();
  defaultApi();
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('HomeScreen', () => {
  it('shows shimmer placeholders first, then the real content', async () => {
    let openGate: () => void = () => {};
    const gate = new Promise<void>(r => (openGate = r));
    feedMock.mockImplementation(async (p: any) => {
      if (p.sort === 'views') return makePage(trendingVideos);
      await gate;
      return makePage(feedVideos);
    });

    renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('grid-skeleton')).toBeOnTheScreen();

    await act(async () => openGate());
    await waitFor(() => expect(screen.queryByTestId('grid-skeleton')).toBeNull(), { timeout: 8000 });
    expect(await screen.findByText('Video 1')).toBeOnTheScreen();
  }, 10000);

  it('shows logo, search, categories (All selected), Trending and All Videos', async () => {
    renderWithProviders(<HomeScreen />);
    expect(screen.getByTestId('home-logo')).toBeOnTheScreen();
    expect(screen.getByTestId('home-search-input')).toBeOnTheScreen();
    expect(await screen.findByTestId('category-Action')).toBeOnTheScreen();
    expect(screen.getByTestId('category-All').props.accessibilityState.selected).toBe(true);
    expect(await screen.findByText('Trending Now')).toBeOnTheScreen();
    expect(screen.getByText('All Videos')).toBeOnTheScreen();
  });

  it('lays the grid out in 3 columns using the responsive card width', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByText('Video 1');
    const list = screen.UNSAFE_getAllByType(FlatList).find(l => l.props.testID === 'home-list')!;
    expect(list.props.numColumns).toBe(3);
    
    const containerWidth = list.props.contentContainerStyle?.width ?? list.props.style?.width ?? 0;
    if (containerWidth > 0) {
      expect(containerWidth).toBeLessThanOrEqual(Math.max(Dimensions.get('window').width, 1));
    }
    expect(getCardWidth(Dimensions.get('window').width)).toBeGreaterThan(0);
  });

  it('shows categories in a horizontal scroll view', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByTestId('category-Action');
    const horizontalScroll = screen.UNSAFE_getAllByType(ScrollView).find(s => s.props.horizontal);
    expect(horizontalScroll).toBeDefined();
    expect(horizontalScroll?.props.horizontal).toBe(true);
  });

  it('shows at least 3 trending cards', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByText('Trending Now');
    const rail = within(await screen.findByTestId('trending-rail'));
    expect(rail.getAllByTestId('video-card').length).toBeGreaterThanOrEqual(3);
  });

  it('selecting a category loads only that category and hides Trending', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByTestId('category-Action');
    await screen.findByText('Trending Now');

    fireEvent.press(screen.getByTestId('category-Action'));

    await waitFor(() =>
      expect(feedMock).toHaveBeenCalledWith(expect.objectContaining({ category: 'Action', offset: 0 })),
    );
    expect(screen.getByTestId('category-Action').props.accessibilityState.selected).toBe(true);
    await waitFor(() => expect(screen.queryByText('Trending Now')).toBeNull());
  });

  it('searches after typing stops (debounced) and shows the results heading', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByTestId('category-Action');
    feedMock.mockClear();

    const input = screen.getByTestId('home-search-input');
    fireEvent.changeText(input, 'n');
    fireEvent.changeText(input, 'ne');
    fireEvent.changeText(input, 'neo');

    expect(feedMock).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'n' }));
    await waitFor(() => expect(feedMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'neo' })));
    expect(feedMock).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'ne' }));
    expect(await screen.findByText(/Results for “neo”/)).toBeOnTheScreen();
  });

  it('shows an empty state when nothing matches', async () => {
    feedMock.mockImplementation(async () => makePage([]));
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByTestId('home-empty')).toBeOnTheScreen();
  });

  it('opens a video when its card is tapped', async () => {
    const onOpenVideo = jest.fn();
    renderWithProviders(<HomeScreen onOpenVideo={onOpenVideo} />);
    await screen.findByText('Video 2');

    const card = screen
      .getAllByTestId('video-card')
      .find(c => String(c.props.accessibilityLabel).startsWith('Video 2'));
    expect(card).toBeDefined();
    fireEvent.press(card!);

    expect(onOpenVideo).toHaveBeenCalledWith(expect.objectContaining({ id: 'v2', title: 'Video 2' }));
  });

  it('starting to scroll stops the running preview', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByText('Video 2');
    previewMock.stopSpy.mockClear();
    fireEvent(screen.getByTestId('home-list'), 'scrollBeginDrag');
    expect(previewMock.stopSpy).toHaveBeenCalled();
  });

  it('loads the next page when the end of the list is reached', async () => {
    feedMock.mockImplementation(async (p: any) => {
      if (p.sort === 'views') return makePage(trendingVideos);
      return p.offset === 0
        ? makePage(feedVideos, { total: 5, nextOffset: 3 })
        : makePage([makeVideo(4), makeVideo(5)], { total: 5, nextOffset: null });
    });
    renderWithProviders(<HomeScreen />);
    await screen.findByText('Video 1');

    fireEvent(screen.getByTestId('home-list'), 'endReached');

    await waitFor(() => expect(feedMock).toHaveBeenCalledWith(expect.objectContaining({ offset: 3 })));
    expect(await screen.findByText('Video 5')).toBeOnTheScreen();
    expect(await screen.findByText('You’re all caught up')).toBeOnTheScreen();
  });

  it('shows an error state with Try again when loading fails', async () => {
    feedMock.mockImplementation(async (p: any) => {
      if (p.sort === 'views') return makePage([]);
      throw new AppError('network', 'offline');
    });
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByTestId('home-error', {}, { timeout: 4000 })).toBeOnTheScreen();

    feedMock.mockImplementation(async (p: any) =>
      p.sort === 'views' ? makePage([]) : makePage(feedVideos),
    );
    fireEvent.press(screen.getByTestId('home-retry'));
    expect(await screen.findByText('Video 1')).toBeOnTheScreen();
  });

  it('still works when the category list fails to load', async () => {
    categoriesMock.mockRejectedValue(new AppError('server', 'nope'));
    renderWithProviders(<HomeScreen />);
    expect(await screen.findByText('Video 1')).toBeOnTheScreen();
    expect(screen.getByTestId('category-All')).toBeOnTheScreen();
  });

  describe('scroll behaviour of the search bar', () => {
    const scrollTo = (y: number) =>
      act(() => {
        fireEvent.scroll(screen.getByTestId('home-list'), {
          nativeEvent: {
            contentOffset: { y },
            contentSize: { height: 3000, width: 400 },
            layoutMeasurement: { height: 800, width: 400 },
          },
        });
      });
    const expanded = () => screen.getByTestId('home-search-toggle').props.accessibilityState.expanded;

    it('collapses after scrolling down and expands again at the top', async () => {
      renderWithProviders(<HomeScreen />);
      await screen.findByText('Video 1');
      expect(expanded()).toBe(true);
      scrollTo(120);
      expect(expanded()).toBe(false);
      scrollTo(30);
      expect(expanded()).toBe(false);
      scrollTo(0);
      expect(expanded()).toBe(true);
    });

    it('tapping the icon re-opens the search bar, dragging closes it', async () => {
      renderWithProviders(<HomeScreen />);
      await screen.findByText('Video 1');
      scrollTo(200);
      fireEvent.press(screen.getByTestId('home-search-toggle'));
      expect(expanded()).toBe(true);
      fireEvent(screen.getByTestId('home-list'), 'scrollBeginDrag');
      expect(expanded()).toBe(false);
    });
  });
});