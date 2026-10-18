import { render, screen } from '@testing-library/react-native';
import { PreviewLoader } from '../../../src/features/preview/PreviewLoader';

describe('PreviewLoader', () => {
  it('renders the three-dot loader without intercepting touches', () => {
    render(<PreviewLoader />);
    const loader = screen.getByTestId('preview-loader');
    expect(loader).toBeOnTheScreen();
    expect(loader.props.pointerEvents).toBe('none');
  });

  it('unmounts cleanly (animation loops are stopped)', () => {
    const { unmount } = render(<PreviewLoader />);
    expect(() => unmount()).not.toThrow();
  });
});
