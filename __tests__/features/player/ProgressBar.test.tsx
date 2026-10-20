import { Animated } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProgressBar } from '../../../src/features/player/ProgressBar';

function setup(duration = 100) {
  const handlers = { onScrubStart: jest.fn(), onScrub: jest.fn(), onScrubEnd: jest.fn(), onStep: jest.fn() };
  render(<ProgressBar progress={new Animated.Value(0)} buffered={0.3} duration={duration} {...handlers} />);
  const bar = screen.getByTestId('player-progress');
  fireEvent(bar, 'layout', { nativeEvent: { layout: { width: 200, height: 36 } } });
  return { bar, ...handlers };
}

const touch = (locationX: number, pageX = locationX) => ({ nativeEvent: { locationX, pageX } });

describe('ProgressBar', () => {
  it('tap seeks to the touched position', () => {
    const { bar, onScrubStart, onScrub, onScrubEnd } = setup();
    fireEvent(bar, 'responderGrant', touch(50));
    expect(onScrubStart).toHaveBeenCalledTimes(1);
    expect(onScrub).toHaveBeenLastCalledWith(0.25);
    fireEvent(bar, 'responderRelease', touch(50));
    expect(onScrubEnd).toHaveBeenCalledWith(0.25);
  });

  it('dragging follows the finger', () => {
    const { bar, onScrub, onScrubEnd } = setup();
    fireEvent(bar, 'responderGrant', touch(50));
    fireEvent(bar, 'responderMove', touch(50, 150)); // moved +100px
    expect(onScrub).toHaveBeenLastCalledWith(0.75);
    fireEvent(bar, 'responderRelease', touch(50, 150));
    expect(onScrubEnd).toHaveBeenCalledWith(0.75);
  });

  it('clamps to 0..1 when dragged past the ends', () => {
    const { bar, onScrub } = setup();
    fireEvent(bar, 'responderGrant', touch(100));
    fireEvent(bar, 'responderMove', touch(100, 900));
    expect(onScrub).toHaveBeenLastCalledWith(1);
    fireEvent(bar, 'responderMove', touch(100, -900));
    expect(onScrub).toHaveBeenLastCalledWith(0);
  });

  it('shows a time bubble only while scrubbing', () => {
    const { bar } = setup(100);
    expect(screen.queryByTestId('progress-bubble')).toBeNull();
    fireEvent(bar, 'responderGrant', touch(100));
    expect(screen.getByTestId('progress-bubble')).toHaveTextContent('0:50');
    fireEvent(bar, 'responderRelease', touch(100));
    expect(screen.queryByTestId('progress-bubble')).toBeNull();
  });

  it('supports accessibility increment / decrement', () => {
    const { bar, onStep } = setup();
    fireEvent(bar, 'accessibilityAction', { nativeEvent: { actionName: 'increment' } });
    fireEvent(bar, 'accessibilityAction', { nativeEvent: { actionName: 'decrement' } });
    expect(onStep).toHaveBeenNthCalledWith(1, 10);
    expect(onStep).toHaveBeenNthCalledWith(2, -10);
  });
});
