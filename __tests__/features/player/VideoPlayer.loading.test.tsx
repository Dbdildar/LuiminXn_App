import { act, fireEvent, screen } from '@testing-library/react-native';
import { VideoPlayer } from '../../../src/features/player/VideoPlayer';
import { PLAYER } from '../../../src/features/player/playerConfig';
import { makeVideo } from '../../helpers/fixtures';
import { renderWithProviders } from '../../helpers/renderWithProviders';

// Kept in case other components import NetInfo.
jest.mock('@react-native-community/netinfo', () =>
  require('../../helpers/netInfoMock').netInfoModule,
);
jest.setTimeout(15000);
// Names start with "mock" so jest.mock's hoisting check allows them (only read lazily).
const mockSeek = jest.fn();
let mockOffline = false;
const mockOfflineListeners = new Set<(v: boolean) => void>();

jest.mock('react-native-video', () => {
  const MockReact = require('react');
  const { View } = require('react-native');

  const MockVideo = MockReact.forwardRef((props: any, ref: any) => {
    MockReact.useImperativeHandle(ref, () => ({
      seek: mockSeek,
    }));
    return MockReact.createElement(View, { testID: 'rn-video', ...props });
  });

  return { __esModule: true, default: MockVideo };
});

// Controllable replacement for useIsOffline.
jest.mock('../../../src/features/player/useIsOffline', () => {
  const MockReact = require('react');
  return {
    useIsOffline: () => {
      const [value, setValue] = MockReact.useState(mockOffline);
      MockReact.useEffect(() => {
        mockOfflineListeners.add(setValue);
        return () => {
          mockOfflineListeners.delete(setValue);
        };
      }, []);
      return value;
    },
  };
});

const video = makeVideo(1, { title: 'Neon Nights' }) as any;
const rn = () => screen.getByTestId('rn-video');
const errorTitle = () => screen.queryByTestId('player-error-title');

/** Renders WITHOUT the first-frame event so the "before playing" state is visible. */
function mount() {
  renderWithProviders(
    <VideoPlayer video={video} isFullscreen={false} onToggleFullscreen={jest.fn()} />,
  );
  fireEvent(screen.getByTestId('video-player'), 'layout', {
    nativeEvent: { layout: { width: 400, height: 225 } },
  });
}

const ready = () => {
  fireEvent(rn(), 'load', { duration: 100 });
  fireEvent(rn(), 'readyForDisplay');
};

const progress = (t: number) =>
  fireEvent(rn(), 'progress', { currentTime: t, playableDuration: t + 10, seekableDuration: 100 });

const setOffline = (value: boolean) => {
  mockOffline = value;
  act(() => {
    mockOfflineListeners.forEach(l => l(value));
  });
};
const goOffline = () => setOffline(true);
const goOnline = () => setOffline(false);

beforeEach(() => {
  jest.useFakeTimers();
  mockOffline = false;
  mockOfflineListeners.clear();
  mockSeek.mockClear();
});

afterEach(() => {
  if ((setTimeout as any).clock) {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  }
  jest.useRealTimers();
});

describe('VideoPlayer loading states', () => {
  it('shows the spinner before the first frame, then hides it', () => {
    mount();
    expect(screen.getByTestId('player-buffering')).toBeOnTheScreen();
    expect(screen.getByText('Loading…')).toBeOnTheScreen();
    expect(screen.queryByTestId('player-play-pause')).toBeNull();
    ready();
    expect(screen.queryByTestId('player-buffering')).toBeNull();
    expect(screen.getByTestId('player-play-pause')).toBeOnTheScreen();
  });

  it('shows "Buffering…" when playback stalls', () => {
    mount();
    ready();
    fireEvent(rn(), 'buffer', { isBuffering: true });
    expect(screen.getByText('Buffering…')).toBeOnTheScreen();
    fireEvent(rn(), 'buffer', { isBuffering: false });
    expect(screen.queryByTestId('player-buffering')).toBeNull();
  });

  it('shows the loader after a seek until the player confirms it', () => {
    mount();
    ready();
    progress(10);
    fireEvent.press(screen.getByTestId('player-forward'));
    expect(screen.getByTestId('player-buffering')).toBeOnTheScreen();
    fireEvent(rn(), 'seek', { currentTime: 20, seekTime: 20 });
    expect(screen.queryByTestId('player-buffering')).toBeNull();
  },15000);

  it('also clears the seek loader once playback reaches the new position', () => {
    mount();
    ready();
    progress(10);
    fireEvent.press(screen.getByTestId('player-forward')); // target 20
    progress(20.25);
    expect(screen.queryByTestId('player-buffering')).toBeNull();
  });

  it('never leaves the seek loader up forever', () => {
    mount();
    ready();
    progress(10);
    fireEvent.press(screen.getByTestId('player-forward'));
    act(() => {
      jest.advanceTimersByTime(PLAYER.seekTimeoutMs + 50);
    });
    expect(screen.queryByTestId('player-buffering')).toBeNull();
  });

  it('shows "Slow connection…" when loading takes too long', () => {
    mount();
    act(() => {
      jest.advanceTimersByTime(PLAYER.stallMs + 50);
    });
    expect(screen.getByText('Slow connection…')).toBeOnTheScreen();
  });
});

describe('VideoPlayer network errors', () => {
  it('shows "No internet connection" when offline while loading', () => {
    mount();
    goOffline();
    expect(screen.getByTestId('player-error-title')).toHaveTextContent('No internet connection');
    expect(screen.queryByTestId('player-buffering')).toBeNull();
  });

  it('does not interrupt smooth playback just because the device went offline', () => {
    mount();
    ready();
    goOffline();
    expect(errorTitle()).toBeNull();
    expect(screen.getByTestId('player-play-pause')).toBeOnTheScreen();
  });

  it('shows the network message when a stall ends in an error while offline', () => {
    mount();
    ready();
    fireEvent(rn(), 'error', { error: {} });
    goOffline();
    expect(screen.getByTestId('player-error-title')).toHaveTextContent('No internet connection');
  });

  it('retries by itself and resumes where it was when the connection returns', () => {
    mount();
    ready();
    progress(30);
    fireEvent(rn(), 'buffer', { isBuffering: true });

    goOffline();
    expect(screen.getByTestId('player-error-title')).toHaveTextContent('No internet connection');

    goOnline(); // wasBlocked -> retry() remounts Video and remembers 30s
    expect(errorTitle()).toBeNull();
    fireEvent(rn(), 'load', { duration: 100 });
    expect(mockSeek).toHaveBeenCalledWith(30);
  });

  it('Try again also resumes from the last position', () => {
    mount();
    ready();
    progress(42);
    fireEvent(rn(), 'error', { error: {} });
    expect(screen.getByTestId('player-error-title')).toHaveTextContent(/play this video/);
    fireEvent.press(screen.getByTestId('player-retry'));
    fireEvent(rn(), 'load', { duration: 100 });
    expect(mockSeek).toHaveBeenCalledWith(42);
  });
});