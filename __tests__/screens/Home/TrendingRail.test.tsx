import { Dimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TrendingRail } from '../../../src/screens/Home/components/TrendingRail';
import { HOME, getCardWidth } from '../../../src/screens/Home/homeConfig';
import { makeVideo } from '../../helpers/fixtures';
import { previewMock } from '../../helpers/previewMock';

jest.mock('../../../src/features/preview', () =>
  require('../../helpers/previewMock').previewModule,
);

beforeEach(() => previewMock.reset());

const videos = [makeVideo(1), makeVideo(2), makeVideo(3), makeVideo(4)];

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

  it('first tap previews, second tap opens', () => {
    const onOpen = jest.fn();
    render(<TrendingRail videos={videos} loading={false} onOpenVideo={onOpen} />);
    const card = () => screen.getAllByTestId('video-card')[1];
    fireEvent.press(card());
    expect(previewMock.startSpy).toHaveBeenCalledWith('v2');
    fireEvent.press(card());
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'v2' }));
  });
});
