import { fireEvent, render, screen } from '@testing-library/react-native';
import { PlayerError } from '../../../src/features/player/PlayerError';

describe('PlayerError', () => {
  it('network variant explains the connection problem', () => {
    render(<PlayerError variant="network" onRetry={jest.fn()} />);
    expect(screen.getByTestId('player-error-title')).toHaveTextContent('No internet connection');
    expect(screen.getByText(/resume where you left off/)).toBeOnTheScreen();
  });

  it('playback variant shows the generic message', () => {
    render(<PlayerError variant="playback" onRetry={jest.fn()} />);
    expect(screen.getByTestId('player-error-title')).toHaveTextContent('Couldn’t play this video');
  });

  it('Try again calls onRetry', () => {
    const onRetry = jest.fn();
    render(<PlayerError variant="network" onRetry={onRetry} />);
    fireEvent.press(screen.getByTestId('player-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
