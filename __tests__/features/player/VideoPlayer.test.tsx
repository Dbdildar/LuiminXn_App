import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { VideoPlayer } from '../../../src/features/player/VideoPlayer';
import { PLAYER } from '../../../src/features/player/playerConfig';
import { makeVideo } from '../../helpers/fixtures';
import { renderWithProviders } from '../../helpers/renderWithProviders';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () =>
  require('../../helpers/netInfoMock').netInfoModule,
);

// Name starts with "mock" so jest.mock's hoisting check allows it (only read lazily).
const mockSeek = jest.fn();

// Mock react-native-video: renders a View with testID="rn-video" and exposes seek() on the ref.
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

const video = makeVideo(1, { title: 'Neon Nights' }) as any;

const rn = () => screen.getByTestId('rn-video');
const surface = () => screen.getByTestId('player-surface');

const progress = (currentTime: number) =>
  fireEvent(rn(), 'progress', {
    currentTime,
    playableDuration: currentTime + 20,
    seekableDuration: 100,
  });

// The real native player fires onSeek when a seek completes; this clears the "seeking" loader.
const finishSeek = () => {
  act(() => {
    fireEvent(rn(), 'seek');
  });
};

function setup(props: Partial<React.ComponentProps<typeof VideoPlayer>> = {}) {
  const handlers = {
    onToggleFullscreen: jest.fn(),
    onViewQualified: jest.fn(),
    onEnded: jest.fn(),
  };
  renderWithProviders(
    <VideoPlayer video={video} isFullscreen={false} {...handlers} {...props} />,
  );
  fireEvent(screen.getByTestId('video-player'), 'layout', {
    nativeEvent: { layout: { width: 400, height: 225 } },
  });
  fireEvent(rn(), 'load', { duration: 100 });
  fireEvent(rn(), 'readyForDisplay');
  return handlers;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockSeek.mockClear();
});

afterEach(() => {
  // Only flush timers if fake timers are still active (avoids the console.warn spam).
  if ((setTimeout as any).clock) {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  }
  jest.useRealTimers();
});

describe('VideoPlayer', () => {
  it('autoplays the video url, unmuted at 1x', () => {
    setup();
    expect(rn().props.source).toEqual({ uri: video.videoUrl });
    expect(rn().props.paused).toBe(false);
    expect(rn().props.muted).toBe(false);
    expect(rn().props.rate).toBe(1);
  });

  it('play / pause button toggles playback', () => {
    setup();
    fireEvent.press(screen.getByTestId('player-play-pause'));
    expect(rn().props.paused).toBe(true);
    fireEvent.press(screen.getByTestId('player-play-pause'));
    expect(rn().props.paused).toBe(false);
  });

  it('mute button toggles sound', () => {
    setup();
    fireEvent.press(screen.getByTestId('player-mute'));
    expect(rn().props.muted).toBe(true);
    expect(screen.getByLabelText('Unmute')).toBeOnTheScreen();
  },10000);

  it('forward / rewind buttons seek by 10 seconds and clamp at 0', () => {
    setup();
    progress(20);
    fireEvent.press(screen.getByTestId('player-forward'));
    expect(mockSeek).toHaveBeenLastCalledWith(30);

    finishSeek(); // seek completed -> loader gone, controls usable again
    progress(5);
    fireEvent.press(screen.getByTestId('player-rewind'));
    expect(mockSeek).toHaveBeenLastCalledWith(0);
  });

  it('shows the remaining time like Netflix', () => {
    setup();
    progress(20);
    // duration 100 - currentTime 20 = 80s remaining -> "1:20" (minus sign may be a separate element)
    expect(screen.getByTestId('player-remaining')).toHaveTextContent(/1:20/);
  });

  it('double tap on the right side seeks +10s and shows a flash', () => {
    setup();
    progress(20);
    fireEvent.press(surface(), { nativeEvent: { locationX: 360 } });
    fireEvent.press(surface(), { nativeEvent: { locationX: 360 } });
    expect(mockSeek).toHaveBeenCalledTimes(1);
    expect(mockSeek).toHaveBeenCalledWith(30);
    expect(screen.getByTestId('player-skip-right')).toBeOnTheScreen();
  });

  it('double tap on the left side seeks -10s', () => {
    setup();
    progress(40);
    fireEvent.press(surface(), { nativeEvent: { locationX: 20 } });
    fireEvent.press(surface(), { nativeEvent: { locationX: 20 } });
    expect(mockSeek).toHaveBeenCalledWith(30);
    expect(screen.getByTestId('player-skip-left')).toBeOnTheScreen();
  });

  it('keeps seeking while tapping repeatedly', () => {
    setup();
    progress(10);
    for (let i = 0; i < 3; i++) {
      fireEvent.press(surface(), { nativeEvent: { locationX: 360 } });
    }
    expect(mockSeek).toHaveBeenCalledTimes(2);
    // The Icon renders its name as text in tests, so match only the seconds label.
    expect(screen.getByTestId('player-skip-right')).toHaveTextContent(/20 seconds/);
  });

  it('a single tap hides the controls after the double-tap window', () => {
    setup();
    fireEvent.press(surface(), { nativeEvent: { locationX: 200 } });
    act(() => {
      jest.advanceTimersByTime(PLAYER.doubleTapMs + 20);
    });
    expect(screen.queryByTestId('player-controls')).toBeNull();
  });

  it('controls auto-hide while playing', () => {
    setup();
    expect(screen.getByTestId('player-controls')).toBeOnTheScreen();
    act(() => {
      jest.advanceTimersByTime(PLAYER.controlsHideMs + 50);
    });
    expect(screen.queryByTestId('player-controls')).toBeNull();
  });

  it('press and hold plays at 3x, releasing returns to normal', () => {
    setup();
    fireEvent(surface(), 'longPress');
    expect(rn().props.rate).toBe(3);
    expect(screen.getByTestId('player-hold-pill')).toBeOnTheScreen();
    fireEvent(surface(), 'pressOut');
    expect(rn().props.rate).toBe(1);
    expect(screen.queryByTestId('player-hold-pill')).toBeNull();
  });

  it('speed menu changes the playback rate', () => {
    setup();
    fireEvent.press(screen.getByTestId('player-speed'));
    fireEvent.press(screen.getByTestId('player-speed-1.5'));
    expect(rn().props.rate).toBe(1.5);
    expect(screen.queryByTestId('player-speed-menu')).toBeNull();
  });

  it('seeks when the progress bar is tapped or dragged', () => {
    setup();
    const bar = screen.getByTestId('player-progress');
    fireEvent(bar, 'layout', { nativeEvent: { layout: { width: 200, height: 36 } } });
    fireEvent(bar, 'responderGrant', { nativeEvent: { locationX: 100, pageX: 100 } });
    expect(mockSeek).not.toHaveBeenCalled(); // only on release
    fireEvent(bar, 'responderRelease', { nativeEvent: { locationX: 100, pageX: 100 } });
    expect(mockSeek).toHaveBeenCalledWith(50);
  });

  it('shows a replay button at the end and restarts from 0', () => {
    const { onEnded } = setup();
    fireEvent(rn(), 'end');
    expect(onEnded).toHaveBeenCalled();
    expect(screen.queryByTestId('player-play-pause')).toBeNull();

    fireEvent.press(screen.getByTestId('player-replay'));
    expect(mockSeek).toHaveBeenCalledWith(0);
    expect(rn().props.paused).toBe(false);

    finishSeek(); // replay starts a seek; wait for it to complete before the controls return
    expect(screen.getByTestId('player-play-pause')).toBeOnTheScreen();
  });

  it('counts a view once after 5 seconds of playback', () => {
    const { onViewQualified } = setup();
    for (let t = 0; t <= 9; t += 0.25) progress(t);
    expect(onViewQualified).toHaveBeenCalledTimes(1);
    expect(onViewQualified).toHaveBeenCalledWith(video);
  });

  it('does not count a view for a seek', () => {
    const { onViewQualified } = setup();
    progress(0);
    progress(80);
    expect(onViewQualified).not.toHaveBeenCalled();
  });

  it('shows a spinner while buffering', () => {
    setup();
    fireEvent(rn(), 'buffer', { isBuffering: true });
    expect(screen.getByTestId('player-buffering')).toBeOnTheScreen();
    fireEvent(rn(), 'buffer', { isBuffering: false });
    expect(screen.queryByTestId('player-buffering')).toBeNull();
  });

  it('fullscreen button calls onToggleFullscreen', () => {
    const { onToggleFullscreen } = setup();
    fireEvent.press(screen.getByTestId('player-fullscreen'));
    expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
  });

  it('in fullscreen the top bar has an exit button and the title', () => {
    const { onToggleFullscreen } = setup({ isFullscreen: true });
    expect(screen.getByText('Neon Nights')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('player-exit-fullscreen'));
    expect(onToggleFullscreen).toHaveBeenCalled();
  });

  it('is paused from outside when suspended (search open)', () => {
    setup({ suspended: true });
    expect(rn().props.paused).toBe(true);
  });

  it('shows an error with Try again', () => {
    setup();
    fireEvent(rn(), 'error', { error: {} });
    expect(screen.getByTestId('player-error')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('player-retry'));
    expect(screen.queryByTestId('player-error')).toBeNull();
  });
});