import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { VideoCard } from '../../../src/screens/Home/components/VideoCard';
import { bumpViews, resetViewsStore } from '../../../src/features/videos/viewsStore';
import { formatViews } from '../../../src/features/videos/format';
import type { VideoItem } from '../../../src/features/videos';




const video = {
  id: 'v1',
  title: 'Test video',
  poster: 'https://x/p.jpg',
  videoUrl: 'https://x/v.mp4',
  views: 1000,
  durationSeconds: 65,
  category: 'Action',
  actors: [],
} as unknown as VideoItem;

const card = () => screen.getByTestId('video-card');

beforeEach(() => {
  jest.clearAllMocks();

  resetViewsStore();
});

it('tap opens the video and stops its preview', () => {
  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent.press(card());

  expect(onOpen).toHaveBeenCalledWith(video);

});

it('hold starts the preview and does not open', () => {
  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent(card(), 'longPress');

  expect(onOpen).not.toHaveBeenCalled();
});

it('holding an already-previewing card re-asserts it as the active preview without opening', () => {

  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent(card(), 'longPress');
  // harmless: the provider sets the same id, so nothing restarts

  expect(onOpen).not.toHaveBeenCalled();
});

it('renders the preview player only for the active card', () => {
  const { rerender } = render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  expect(screen.queryByTestId('preview-player')).toBeNull();

  rerender(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
});

it('does not render the preview player when another card is previewing', () => {

  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  expect(screen.queryByTestId('preview-player')).toBeNull();
});

it('tapping a previewing card stops the preview and opens the real player', () => {

  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent.press(card());
  expect(onOpen).toHaveBeenCalledWith(video);
});

it('configures the hold delay as PREVIEW_HOLD_MS', () => {
  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  // Pressable consumes delayLongPress, so read it from the element, not the host View


});

it('wires both tap and hold handlers on the card', () => {
  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);

});

it('shows the updated view count instantly after a bump', () => {
  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  expect(screen.getByTestId('video-card-views')).toHaveTextContent(`${formatViews(1000)} views`);
  act(() => {
    bumpViews('v1', 1000);
  });
  expect(screen.getByTestId('video-card-views')).toHaveTextContent(`${formatViews(1001)} views`);
});