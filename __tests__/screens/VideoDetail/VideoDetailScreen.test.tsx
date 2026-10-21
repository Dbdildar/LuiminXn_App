import Orientation from 'react-native-orientation-locker';
import { BackHandler } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { VideoDetailScreen } from '../../../src/screens/VideoDetail';
import { makePage, makeVideo } from '../../helpers/fixtures';
import { renderWithProviders } from '../../helpers/renderWithProviders';

jest.mock('@react-native-community/netinfo', () =>
  require('../../helpers/netInfoMock').netInfoModule,
);

jest.mock('react-native-orientation-locker', () => ({
  lockToLandscape: jest.fn(),
  lockToPortrait: jest.fn(),
  unlockAllOrientations: jest.fn(),
}));

jest.mock('../../../src/features/videos/videoApi', () => ({
  PAGE_SIZE: 20,
  fetchVideoPage: jest.fn(),
  fetchCategories: jest.fn(),
  fetchRelated: jest.fn(),
  incrementViews: jest.fn(),
}));

// Lightweight player feature mock: no native video module needed.
jest.mock('../../../src/features/player', () => {
  const React = require('react');
  const { View, Pressable, Text } = require('react-native');
  const OrientationLocker = require('react-native-orientation-locker');

  const useFullscreen = () => {
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const ref = React.useRef(false);
    const toggle = React.useCallback(() => {
      const next = !ref.current;
      ref.current = next;
      if (next) {
        OrientationLocker.lockToLandscape();
      } else {
        OrientationLocker.lockToPortrait();
      }
      setIsFullscreen(next);
    }, []);
    return { isFullscreen, toggle };
  };

  const VideoPlayer = ({ video, style, isFullscreen, onToggleFullscreen, onViewQualified, suspended }: any) => {
    const qualified = React.useRef(false);
    return (
      <View testID="video-player" style={style}>
        <View
          testID="rn-video"
          source={{ uri: video.videoUrl }}
          suspended={!!suspended}
          onLoad={() => {}}
          onProgress={(e: any) => {
            const t = e?.currentTime ?? e?.nativeEvent?.currentTime ?? 0;
            if (!qualified.current && t >= 5) {
              qualified.current = true;
              onViewQualified && onViewQualified();
            }
          }}
        />
        <Pressable
          testID={isFullscreen ? 'player-exit-fullscreen' : 'player-fullscreen'}
          onPress={onToggleFullscreen}>
          <Text>{isFullscreen ? 'Exit' : 'Maximize'}</Text>
        </Pressable>
      </View>
    );
  };

  return {
    VideoPlayer,
    useFullscreen,
    getPlayerHeight: () => 200,
  };
});

import {
  fetchCategories,
  fetchRelated,
  fetchVideoPage,
  incrementViews,
} from '../../../src/features/videos/videoApi';

const feedMock = fetchVideoPage as jest.Mock;
const relatedMock = fetchRelated as jest.Mock;
const incrementMock = incrementViews as jest.Mock;

const video = makeVideo(1, { title: 'The Long Night', views: 100 }) as any;
const relatedVideos = [
  makeVideo(2, { title: 'Related Two' }),
  makeVideo(3, { title: 'Related Three' }),
];
const hit = makeVideo(20, { title: 'Neon Search Hit' });

function playFiveSeconds() {
  const videoElement = screen.getByTestId('rn-video');
  fireEvent(videoElement, 'load', { duration: 200 });
  for (let t = 0; t <= 6; t += 0.25) {
    fireEvent(videoElement, 'progress', {
      currentTime: t,
      playableDuration: t + 10,
      seekableDuration: 200,
    });
  }
}

let backListener: (() => boolean) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  backListener = null;

  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, callback) => {
    if (event === 'hardwareBackPress') {
      backListener = callback as () => boolean;
    }
    return { remove: jest.fn() } as any;
  });

  (fetchCategories as jest.Mock).mockResolvedValue([]);
  feedMock.mockImplementation(async (p: any) => makePage(p.search ? [hit] : []));
  relatedMock.mockResolvedValue(relatedVideos);
  incrementMock.mockResolvedValue(150);
});

const mockPressBack = () => (backListener ? backListener() : false);

describe('VideoDetailScreen', () => {
  it('shows the player, the title and only back + search in the header', async () => {
    renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
    expect(screen.getByTestId('video-detail-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('video-detail-title')).toHaveTextContent('The Long Night');
    expect(screen.getByTestId('rn-video').props.source).toEqual({ uri: video.videoUrl });
    expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
    expect(screen.getByLabelText('Search')).toBeOnTheScreen();
    expect(screen.queryByTestId('video-detail-search-input')).toBeNull();
    await screen.findByText('Related Two');
  });

  it('back goes to Home', async () => {
    const onBack = jest.fn();
    renderWithProviders(<VideoDetailScreen video={video} onBack={onBack} />);
    fireEvent.press(screen.getByTestId('video-detail-back'));
    expect(onBack).toHaveBeenCalledTimes(1);
    await screen.findByText('Related Two');
  });

  it('lists similar videos', async () => {
    renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
    expect(await screen.findByText('Related Two')).toBeOnTheScreen();
    expect(screen.getByText('Related Three')).toBeOnTheScreen();
    expect(relatedMock).toHaveBeenCalledWith(video);
  });

  it('shows an empty message and a retry on failure', async () => {
    relatedMock.mockRejectedValue(new Error('boom'));
    renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
    expect(await screen.findByTestId('related-retry', {}, { timeout: 4000 })).toBeOnTheScreen();
  });

  it('counts a view after 5s: +1 instantly, then the database total', async () => {
    renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
    expect(screen.getByTestId('video-detail-views')).toHaveTextContent('105 views');
    act(() => {
      playFiveSeconds();
    });
    expect(incrementMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.getByTestId('video-detail-views')).toHaveTextContent('150 views'),
    );
    await screen.findByText('Related Two');
  });

  describe('search', () => {
    it('search icon opens a search field and pauses the video', async () => {
      renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
      fireEvent.press(screen.getByTestId('video-detail-search'));
      expect(screen.getByTestId('video-detail-search-input')).toBeOnTheScreen();
      expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
      expect(screen.getByTestId('rn-video').props.suspended).toBe(true);
      await screen.findByText('Related Two');
    });

    it('typing closes the player and shows the matching videos', async () => {
      renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
      fireEvent.press(screen.getByTestId('video-detail-search'));
      fireEvent.changeText(screen.getByTestId('video-detail-search-input'), 'neon');

      expect(screen.queryByTestId('rn-video')).toBeNull();
      expect(await screen.findByText('Neon Search Hit')).toBeOnTheScreen();
      await waitFor(() =>
        expect(feedMock).toHaveBeenCalledWith(expect.objectContaining({ search: 'neon' })),
      );
      expect(screen.getByText(/Results for “neon”/)).toBeOnTheScreen();
    });

    it('shows a message when nothing matches', async () => {
      feedMock.mockImplementation(async () => makePage([]));
      renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
      fireEvent.press(screen.getByTestId('video-detail-search'));
      fireEvent.changeText(screen.getByTestId('video-detail-search-input'), 'zzz');
      expect(await screen.findByTestId('results-empty')).toBeOnTheScreen();
    });

    it('picking a result plays it on this same screen', async () => {
      const onBack = jest.fn();
      renderWithProviders(<VideoDetailScreen video={video} onBack={onBack} />);
      fireEvent.press(screen.getByTestId('video-detail-search'));
      fireEvent.changeText(screen.getByTestId('video-detail-search-input'), 'neon');
      fireEvent.press(await screen.findByText('Neon Search Hit'));

      expect(screen.getByTestId('video-detail-title')).toHaveTextContent('Neon Search Hit');
      expect(screen.queryByTestId('video-detail-search-input')).toBeNull();

      const player = await screen.findByTestId('rn-video');
      expect(player.props.suspended).toBe(false);
      expect(onBack).not.toHaveBeenCalled();
    });

    it('closing the search brings the player back', async () => {
      renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
      fireEvent.press(screen.getByTestId('video-detail-search'));
      fireEvent.changeText(screen.getByTestId('video-detail-search-input'), 'neon');
      await screen.findByText('Neon Search Hit');

      fireEvent.press(screen.getByTestId('video-detail-search-close'));

      await waitFor(() => {
        expect(screen.queryByTestId('video-detail-search-input')).toBeNull();
      });

      expect(await screen.findByText('Related Two')).toBeOnTheScreen();
      expect(screen.getByTestId('video-detail-title')).toHaveTextContent('The Long Night');
      expect(screen.getByTestId('rn-video')).toBeOnTheScreen();
    });

    it('Android back closes the search before leaving the screen', async () => {
      const onBack = jest.fn();
      renderWithProviders(<VideoDetailScreen video={video} onBack={onBack} />);
      fireEvent.press(screen.getByTestId('video-detail-search'));
      act(() => {
        mockPressBack();
      });
      expect(screen.queryByTestId('video-detail-search-input')).toBeNull();
      expect(onBack).not.toHaveBeenCalled();
      await screen.findByText('Related Two');
    });
  });

  describe('similar videos', () => {
    it('tapping one plays it here, and Back still goes straight to Home', async () => {
      const onBack = jest.fn();
      renderWithProviders(<VideoDetailScreen video={video} onBack={onBack} />);
      fireEvent.press(await screen.findByText('Related Two'));

      expect(screen.getByTestId('video-detail-title')).toHaveTextContent('Related Two');
      expect(onBack).not.toHaveBeenCalled();

      fireEvent.press(screen.getByTestId('video-detail-back'));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('loads similar videos for the newly selected video', async () => {
      renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
      fireEvent.press(await screen.findByText('Related Two'));
      await waitFor(() =>
        expect(relatedMock).toHaveBeenCalledWith(expect.objectContaining({ title: 'Related Two' })),
      );
    });
  });

  describe('fullscreen', () => {
    it('maximize rotates to landscape and hides the header and list', async () => {
      renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
      await screen.findByText('Related Two');
      fireEvent.press(screen.getByTestId('player-fullscreen'));

      expect(Orientation.lockToLandscape).toHaveBeenCalled();
      expect(screen.queryByTestId('video-detail-header')).toBeNull();
      expect(screen.queryByText('Related Two')).toBeNull();
      expect(await screen.findByTestId('video-player')).toBeOnTheScreen();
    });

    it('exit returns to the normal layout in portrait', async () => {
      renderWithProviders(<VideoDetailScreen video={video} onBack={jest.fn()} />);
      await screen.findByText('Related Two');
      fireEvent.press(screen.getByTestId('player-fullscreen'));
      fireEvent.press(screen.getByTestId('player-exit-fullscreen'));
      expect(Orientation.lockToPortrait).toHaveBeenCalled();
      expect(screen.getByTestId('video-detail-header')).toBeOnTheScreen();
      expect(await screen.findByText('Related Two')).toBeOnTheScreen();
    });
  });
});