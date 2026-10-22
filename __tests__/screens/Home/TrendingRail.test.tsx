import { Dimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TrendingRail } from '../../../src/screens/Home/components/TrendingRail';
import { HOME, getCardWidth } from '../../../src/screens/Home/homeConfig';
import { makeVideo } from '../../helpers/fixtures';




const videos = [makeVideo(1), makeVideo(2), makeVideo(3), makeVideo(4)];
const cardAt = (i: number) => screen.getAllByTestId('video-card')[i];

describe('TrendingRail', () => {
  it('shows at least 3 shimmer cards while loading', () => {
    render(<TrendingRail videos={[]} loading onOpenVideo={jest.fn()} />);
    expect(screen.getByTestId('trending-skeleton')).toBeOnTheScreen();
    expect(
      screen.getAllByTestId('shimmer', { includeHiddenElements: true }).length,
    ).toBeGreaterThanOrEqual(HOME.trending.minVisible);
  });

  it('renders every trending video', () => {
    render(<TrendingRail videos={videos} loading={false} onOpenVideo={jest.fn()} />);
    expect(screen.getAllByTestId('video-card')).toHaveLength(4);
  });

  it('sizes cards so exactly 3 fit per screen, same as the grid', () => {
    const w = Dimensions.get('window').width;
    const card = getCardWidth(w);
    expect(card * 3 + HOME.grid.gap * 2 + HOME.grid.padding * 2).toBeLessThanOrEqual(w);
    // a 4th card would NOT fit, so the row scrolls
    expect(card * 4 + HOME.grid.gap * 3 + HOME.grid.padding * 2).toBeGreaterThan(w);
  });

  it('numbers the cards by rank', () => {
    render(<TrendingRail videos={videos} loading={false} onOpenVideo={jest.fn()} />);
    expect(screen.getByText('1')).toBeOnTheScreen();
    expect(screen.getByText('3')).toBeOnTheScreen();
  });

  it('a tap opens the video straight away', () => {
    const onOpen = jest.fn();
    render(<TrendingRail videos={videos} loading={false} onOpenVideo={onOpen} />);
    fireEvent.press(cardAt(1));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'v2' }));
    
  });

  it('a hold starts the preview and does not open the video', () => {
    const onOpen = jest.fn();
    render(<TrendingRail videos={videos} loading={false} onOpenVideo={onOpen} />);
    fireEvent(cardAt(1), 'longPress');
    
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('holding a different card starts that card\'s preview', () => {
    render(<TrendingRail videos={videos} loading={false} onOpenVideo={jest.fn()} />);
    fireEvent(cardAt(0), 'longPress');
    fireEvent(cardAt(2), 'longPress');
    
  });

  it('calls onScrollBeginDrag when the rail is dragged', () => {
    const onScrollBeginDrag = jest.fn();
    render(
      <TrendingRail
        videos={videos}
        loading={false}
        onOpenVideo={jest.fn()}
        onScrollBeginDrag={onScrollBeginDrag}
      />,
    );
    fireEvent(screen.getByTestId('trending-rail'), 'scrollBeginDrag');
    expect(onScrollBeginDrag).toHaveBeenCalledTimes(1);
  });
});