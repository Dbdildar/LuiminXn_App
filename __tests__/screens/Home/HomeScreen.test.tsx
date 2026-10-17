import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AppError } from '../../../src/lib/appError';
import { HomeScreen } from '../../../src/screens/Home';
import { makePage, makeVideo } from '../../helpers/fixtures';
import { renderWithProviders } from '../../helpers/renderWithProviders';

jest.mock('../../../src/features/videos/videoApi', () => ({
  PAGE_SIZE: 20,
  fetchVideoPage: jest.fn(),
  fetchCategories: jest.fn(),
}));

import { fetchCategories, fetchVideoPage } from '../../../src/features/videos/videoApi';

const feedMock = fetchVideoPage as jest.Mock;
const categoriesMock = fetchCategories as jest.Mock;

const trendingVideos = [makeVideo(10, { title: 'Trend Ten' }), makeVideo(11, { title: 'Trend Eleven' })];
const feedVideos = [makeVideo(1), makeVideo(2), makeVideo(3)];

function defaultApi() {
  categoriesMock.mockResolvedValue(['Action', 'Drama']);
  feedMock.mockImplementation(async (p: any) =>
    p.sort === 'views' ? makePage(trendingVideos) : makePage(feedVideos),
  );
}



beforeEach(() => {
  feedMock.mockReset();
  categoriesMock.mockReset();
  defaultApi();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});

describe('HomeScreen', () => {
  it('shows shimmer placeholders first, then the real content', async () => {
    let openGate: () => void = () => {};
    const gate = new Promise<void>(resolve => {
      openGate = resolve;
    });
    feedMock.mockImplementation(async (p: any) => {
      if (p.sort === 'views') {
        return makePage(trendingVideos);
      }
      await gate;
      return makePage(feedVideos);
    });

    renderWithProviders(<HomeScreen />);

    expect(screen.getByTestId('grid-skeleton')).toBeOnTheScreen();
    expect(
      screen.getAllByTestId('shimmer', { includeHiddenElements: true }).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      openGate();
    });

    await waitFor(
      () => expect(screen.queryByTestId('grid-skeleton')).toBeNull(),
      { timeout: 8000 },
    );
    expect(await screen.findByText('Video 1', {}, { timeout: 8000 })).toBeOnTheScreen();
  }, 10000); // Expanded timeout window to 10 seconds for this specific test

  it('shows logo, search, categories (All selected), Trending and All Videos', async () => {
    renderWithProviders(<HomeScreen />);

    expect(screen.getByTestId('home-logo')).toBeOnTheScreen();
    expect(screen.getByTestId('home-search-input')).toBeOnTheScreen();

    expect(await screen.findByTestId('category-Action')).toBeOnTheScreen();
    expect(screen.getByTestId('category-All').props.accessibilityState.selected).toBe(true);
    expect(await screen.findByText('Trending Now')).toBeOnTheScreen();
    expect(screen.getByText('All Videos')).toBeOnTheScreen();
    expect(screen.getByText('Trend Ten')).toBeOnTheScreen();
  });

  it('asks the backend for trending by views', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByText('Trending Now');
    expect(feedMock).toHaveBeenCalledWith({ limit: 10, sort: 'views' });
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
    expect(screen.getByTestId('category-All').props.accessibilityState.selected).toBe(false);
    await waitFor(() => expect(screen.queryByText('Trending Now')).toBeNull());
  });

  it('searches after typing stops and shows the results heading', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByTestId('category-Action');

    fireEvent.changeText(screen.getByTestId('home-search-input'), 'neon');

    await waitFor(() =>
      expect(feedMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'neon' })),
    );
    expect(await screen.findByText(/Results for “neon”/)).toBeOnTheScreen();
    expect(screen.queryByText('Trending Now')).toBeNull();
  });

  it('does not search on every keystroke (debounced)', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByTestId('category-Action');
    feedMock.mockClear();

    fireEvent.changeText(screen.getByTestId('home-search-input'), 'n');
    fireEvent.changeText(screen.getByTestId('home-search-input'), 'ne');
    fireEvent.changeText(screen.getByTestId('home-search-input'), 'neo');

    expect(feedMock).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'n' }));
    await waitFor(() =>
      expect(feedMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'neo' })),
    );
    expect(feedMock).not.toHaveBeenCalledWith(expect.objectContaining({ search: 'ne' }));
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

  it('loads the next page when the end of the list is reached', async () => {
    feedMock.mockImplementation(async (p: any) => {
      if (p.sort === 'views') {
        return makePage(trendingVideos);
      }
      return p.offset === 0
        ? makePage(feedVideos, { total: 5, nextOffset: 3 })
        : makePage([makeVideo(4), makeVideo(5)], { total: 5, nextOffset: null });
    });
    renderWithProviders(<HomeScreen />);
    await screen.findByText('Video 1');

    fireEvent(screen.getByTestId('home-list'), 'endReached');

    await waitFor(() =>
      expect(feedMock).toHaveBeenCalledWith(expect.objectContaining({ offset: 3 })),
    );
    expect(await screen.findByText('Video 5')).toBeOnTheScreen();
    expect(await screen.findByText('You’re all caught up')).toBeOnTheScreen();
  });

  it('does not fetch another page when there is none', async () => {
    renderWithProviders(<HomeScreen />);
    await screen.findByText('Video 1');
    feedMock.mockClear();

    fireEvent(screen.getByTestId('home-list'), 'endReached');
    expect(feedMock).not.toHaveBeenCalled();
  });

  it('shows an error state with Try again when loading fails', async () => {
    feedMock.mockImplementation(async (p: any) => {
      if (p.sort === 'views') {
        return makePage([]);
      }
      throw new AppError('network', 'offline');
    });
    renderWithProviders(<HomeScreen />);

    expect(
      await screen.findByTestId('home-error', {}, { timeout: 4000 }),
    ).toBeOnTheScreen();

    feedMock.mockImplementation(async (p: any) =>
      p.sort === 'views' ? makePage([]) : makePage(feedVideos),
    );
    fireEvent.press(screen.getByTestId('home-retry'));

    expect(await screen.findByText('Video 1')).toBeOnTheScreen();
    expect(screen.queryByTestId('home-error')).toBeNull();
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

    const expanded = () =>
      screen.getByTestId('home-search-toggle').props.accessibilityState.expanded;

    it('turns into a search icon after scrolling down and expands again at the top', async () => {
      renderWithProviders(<HomeScreen />);
      await screen.findByText('Video 1');

      expect(expanded()).toBe(true);

      scrollTo(120);
      expect(expanded()).toBe(false);
      expect(screen.getByTestId('home-logo')).toBeOnTheScreen();

      scrollTo(30);
      expect(expanded()).toBe(false);

      scrollTo(0);
      expect(expanded()).toBe(true);
    });

    it('tapping the icon re-opens the search bar in place', async () => {
      renderWithProviders(<HomeScreen />);
      await screen.findByText('Video 1');

      scrollTo(200);
      expect(expanded()).toBe(false);

      fireEvent.press(screen.getByTestId('home-search-toggle'));
      expect(expanded()).toBe(true);

      fireEvent(screen.getByTestId('home-list'), 'scrollBeginDrag');
      expect(expanded()).toBe(false);
    });
  });
});