import {fireEvent, screen} from '@testing-library/react-native';
import {VideoCard} from '../../../src/screens/Home/components';
import {makeVideo} from '../../helpers/fixtures';
import {renderWithProviders} from '../../helpers/renderWithProviders';

describe('VideoCard', () => {
  const a = makeVideo(1, {title: 'Neon Nights', category: 'Action', views: 12_500, durationSeconds: 75});
  const b = makeVideo(2);

  it('shows title, category, duration and views', () => {
    renderWithProviders(<VideoCard video={a} width={170} onOpen={jest.fn()} />);
    expect(screen.getByText('Neon Nights')).toBeOnTheScreen();
    expect(screen.getByText('Action')).toBeOnTheScreen();
    expect(screen.getByText('1:15')).toBeOnTheScreen();
    expect(screen.getByText('12.5K')).toBeOnTheScreen();
  });

  it('shows a rank badge only when a rank is given', () => {
    const {rerender} = renderWithProviders(<VideoCard video={a} width={170} rank={3} onOpen={jest.fn()} />);
    expect(screen.getByTestId('video-card-rank')).toBeOnTheScreen();
    rerender(<VideoCard video={a} width={170} onOpen={jest.fn()} />);
  });

  it('a tap opens the video and does not start a preview', () => {
    const onOpen = jest.fn();
    renderWithProviders(<VideoCard video={a} width={170} onOpen={onOpen} />);
    fireEvent.press(screen.getByTestId('video-card'));
    expect(onOpen).toHaveBeenCalledWith(a);
    expect(screen.queryByTestId('preview-video')).toBeNull();
  });

  it('a long press shows the preview in place (and a loader until it plays)', () => {
    const onOpen = jest.fn();
    renderWithProviders(<VideoCard video={a} width={170} onOpen={onOpen} />);
    fireEvent(screen.getByTestId('video-card'), 'longPress');

    expect(screen.getByTestId('preview-video')).toBeOnTheScreen();
    expect(screen.getByTestId('preview-loader')).toBeOnTheScreen();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('releasing the finger stops the preview', () => {
    renderWithProviders(<VideoCard video={a} width={170} onOpen={jest.fn()} />);
    const card = screen.getByTestId('video-card');
    fireEvent(card, 'longPress');
    fireEvent(card, 'pressOut');
    expect(screen.queryByTestId('preview-video')).toBeNull();
  });

  it('only one card previews at a time', () => {
    renderWithProviders(
      <>
        <VideoCard video={a} width={170} onOpen={jest.fn()} />
        <VideoCard video={b} width={170} onOpen={jest.fn()} />
      </>,
    );
    const [first, second] = screen.getAllByTestId('video-card');
    fireEvent(first, 'longPress');
    fireEvent(second, 'longPress');

    const videos = screen.getAllByTestId('preview-video');
    expect(videos).toHaveLength(1);
    expect(videos[0].props.accessibilityLabel).toBe(b.videoUrl);
  });

  it('has an accessible label and a preview action', () => {
    renderWithProviders(<VideoCard video={a} width={170} onOpen={jest.fn()} />);
    const card = screen.getByTestId('video-card');
    expect(card.props.accessibilityLabel).toContain('Neon Nights');
    expect(card.props.accessibilityHint).toMatch(/hold to preview/i);
  });
});
