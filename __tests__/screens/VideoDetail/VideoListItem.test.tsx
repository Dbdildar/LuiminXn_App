import { fireEvent, render, screen } from '@testing-library/react-native';
import { VideoListItem } from '../../../src/screens/VideoDetail/components/VideoListItem';
import { makeVideo } from '../../helpers/fixtures';

const video = makeVideo(3, { title: 'Neon Nights', category: 'Action', views: 12_345, durationSeconds: 125 }) as any;

describe('VideoListItem', () => {
  it('shows title, category, views and duration', () => {
    render(<VideoListItem video={video} thumbWidth={160} onPress={jest.fn()} />);
    expect(screen.getByText('Neon Nights')).toBeOnTheScreen();
    expect(screen.getByText('Action · 12.3K views')).toBeOnTheScreen();
    expect(screen.getByText('2:05')).toBeOnTheScreen();
  });

  it('calls onPress with the video', () => {
    const onPress = jest.fn();
    render(<VideoListItem video={video} thumbWidth={160} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('video-list-item'));
    expect(onPress).toHaveBeenCalledWith(video);
  });

  it('marks the playing video', () => {
    render(<VideoListItem video={video} thumbWidth={160} isCurrent onPress={jest.fn()} />);
    expect(screen.getByText('Now playing')).toBeOnTheScreen();
  });
});
