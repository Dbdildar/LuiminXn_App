import {Pressable} from 'react-native';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {VideoCard, PREVIEW_HOLD_MS} from '../../../src/screens/Home/components/VideoCard';
import {bumpViews, resetViewsStore} from '../../../src/features/videos/viewsStore';
import {formatViews} from '../../../src/features/videos/format';
import type {VideoItem} from '../../../src/features/videos';

const mockStart = jest.fn();
const mockStop = jest.fn();
let mockPreviewId: string | null = null;

jest.mock('../../../src/features/preview', () => {
  const {View} = require('react-native');
  return {
    usePreview: () => ({previewId: mockPreviewId, startPreview: mockStart, stopPreview: mockStop}),
    PreviewPlayer: () => <View testID="preview-player" />,
    PreviewLoader: () => null,
  };
});

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
  mockPreviewId = null;
  resetViewsStore();
});

it('tap opens the video and stops its preview', () => {
  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent.press(card());
  expect(mockStop).toHaveBeenCalledWith('v1');
  expect(onOpen).toHaveBeenCalledWith(video);
  expect(mockStart).not.toHaveBeenCalled();
});

it('hold starts the preview and does not open', () => {
  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent(card(), 'longPress');
  expect(mockStart).toHaveBeenCalledTimes(1);
  expect(mockStart).toHaveBeenCalledWith('v1');
  expect(onOpen).not.toHaveBeenCalled();
});

it('holding an already-previewing card re-asserts it as the active preview without opening', () => {
  mockPreviewId = 'v1';
  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent(card(), 'longPress');
  // harmless: the provider sets the same id, so nothing restarts
  expect(mockStart).toHaveBeenCalledWith('v1');
  expect(mockStop).not.toHaveBeenCalled();
  expect(onOpen).not.toHaveBeenCalled();
});

it('renders the preview player only for the active card', () => {
  const {rerender} = render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  expect(screen.queryByTestId('preview-player')).toBeNull();
  mockPreviewId = 'v1';
  rerender(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  expect(screen.getByTestId('preview-player')).toBeTruthy();
});

it('does not render the preview player when another card is previewing', () => {
  mockPreviewId = 'other';
  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  expect(screen.queryByTestId('preview-player')).toBeNull();
});

it('tapping a previewing card stops the preview and opens the real player', () => {
  mockPreviewId = 'v1';
  const onOpen = jest.fn();
  render(<VideoCard video={video} width={120} onOpen={onOpen} />);
  fireEvent.press(card());
  expect(mockStop).toHaveBeenCalledWith('v1');
  expect(onOpen).toHaveBeenCalledWith(video);
});

it('configures the hold delay as PREVIEW_HOLD_MS', () => {
  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  // Pressable consumes delayLongPress, so read it from the element, not the host View
  const pressable = screen.UNSAFE_getByType(Pressable);
  expect(pressable.props.delayLongPress).toBe(PREVIEW_HOLD_MS);
});

it('wires both tap and hold handlers on the card', () => {
  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  const pressable = screen.UNSAFE_getByType(Pressable);
  expect(typeof pressable.props.onPress).toBe('function');
  expect(typeof pressable.props.onLongPress).toBe('function');
});

it('shows the updated view count instantly after a bump', () => {
  render(<VideoCard video={video} width={120} onOpen={jest.fn()} />);
  expect(screen.getByTestId('video-card-views')).toHaveTextContent(`${formatViews(1000)} views`);
  act(() => {
    bumpViews('v1', 1000);
  });
  expect(screen.getByTestId('video-card-views')).toHaveTextContent(`${formatViews(1001)} views`);
});