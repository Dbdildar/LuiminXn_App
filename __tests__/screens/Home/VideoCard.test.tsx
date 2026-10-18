
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { VideoCard } from '../../../src/screens/Home/components/VideoCard';
import { HOME } from '../../../src/screens/Home/homeConfig';
import { makeVideo } from '../../helpers/fixtures';
import { previewMock } from '../../helpers/previewMock';

jest.mock('../../../src/features/preview', () =>
  require('../../helpers/previewMock').previewModule,
);

const video = makeVideo(2, { title: 'Neon Nights' });

beforeEach(() => {
  jest.useFakeTimers();
  previewMock.reset();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const renderCard = (onOpen = jest.fn()) => {
  render(<VideoCard video={video} width={110} onOpen={onOpen} />);
  return { onOpen, card: () => screen.getByTestId('video-card') };
};

describe('VideoCard', () => {
  it('shows the title', () => {
    renderCard();
    expect(screen.getByText('Neon Nights')).toBeOnTheScreen();
  });

  it('a quick tap starts the preview immediately and does not open the video', () => {
    const { onOpen, card } = renderCard();
    fireEvent.press(card());
    expect(previewMock.startSpy).toHaveBeenCalledWith(video.id);
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByTestId('preview-player')).toBeOnTheScreen();
  });

  it('shows the loader until the first frame is ready', () => {
    const { card } = renderCard();
    fireEvent.press(card());
    expect(screen.getByTestId('preview-loader')).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId('preview-player')); // simulate onReady
    expect(screen.queryByTestId('preview-loader')).toBeNull();
  });

  it('touch held past the delay starts the preview, and releasing keeps it playing', () => {
    const { onOpen, card } = renderCard();
    fireEvent(card(), 'pressIn');
    expect(previewMock.startSpy).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(HOME.preview.touchDelayMs + 5);
    });
    expect(previewMock.startSpy).toHaveBeenCalledTimes(1);

    fireEvent(card(), 'pressOut');
    fireEvent.press(card());
    expect(onOpen).not.toHaveBeenCalled();
    expect(previewMock.stopSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('preview-player')).toBeOnTheScreen();
  });

  it('cancels the preview if the touch ends (e.g. a scroll) before the delay', () => {
    const { card } = renderCard();
    fireEvent(card(), 'pressIn');
    fireEvent(card(), 'pressOut');
    act(() => {
      jest.advanceTimersByTime(HOME.preview.touchDelayMs * 3);
    });
    expect(previewMock.startSpy).not.toHaveBeenCalled();
  });

  it('tapping a card that is already previewing opens it and stops the preview', () => {
    const { onOpen, card } = renderCard();
    fireEvent.press(card()); // start
    fireEvent.press(card()); // open
    expect(onOpen).toHaveBeenCalledWith(video);
    expect(previewMock.stopSpy).toHaveBeenCalledWith(video.id);
  });

  it('renders a rank badge when given one', () => {
    render(<VideoCard video={video} width={110} onOpen={jest.fn()} rank={2} />);
    expect(screen.getByText('2')).toBeOnTheScreen();
  });
});
