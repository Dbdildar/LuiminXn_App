import { render, screen } from '@testing-library/react-native';
import { BufferingLoader } from '../../../src/features/player/BufferingLoader';

describe('BufferingLoader', () => {
  it('renders the spinner with a label and does not block touches', () => {
    render(<BufferingLoader label="Buffering…" />);
    const loader = screen.getByTestId('player-buffering');
    expect(loader.props.pointerEvents).toBe('none');
    expect(screen.getByText('Buffering…')).toBeOnTheScreen();
    expect(screen.getByLabelText('Buffering…')).toBeOnTheScreen();
  });

  it('works without a label', () => {
    render(<BufferingLoader />);
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });

  it('stops its animations on unmount', () => {
    const { unmount } = render(<BufferingLoader />);
    expect(() => unmount()).not.toThrow();
  });
});
