import { fireEvent, render, screen } from '@testing-library/react-native';
import { DetailHeader } from '../../../src/screens/VideoDetail/components/DetailHeader';

const base = {
  searchOpen: false,
  query: '',
  topInset: 0,
  onBack: jest.fn(),
  onOpenSearch: jest.fn(),
  onCloseSearch: jest.fn(),
  onChangeQuery: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('DetailHeader', () => {
  it('shows only a back button and a search icon', () => {
    render(<DetailHeader {...base} />);
    expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
    expect(screen.getByLabelText('Search')).toBeOnTheScreen();
    expect(screen.queryByTestId('video-detail-search-input')).toBeNull();
  });

  it('back and search icon call their handlers', () => {
    render(<DetailHeader {...base} />);
    fireEvent.press(screen.getByTestId('video-detail-back'));
    fireEvent.press(screen.getByTestId('video-detail-search'));
    expect(base.onBack).toHaveBeenCalledTimes(1);
    expect(base.onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it('search mode shows an input and a close button, and keeps the back button', () => {
    render(<DetailHeader {...base} searchOpen query="neo" />);
    expect(screen.getByTestId('video-detail-search-input').props.value).toBe('neo');
    expect(screen.getByLabelText('Go back')).toBeOnTheScreen();
    fireEvent.changeText(screen.getByTestId('video-detail-search-input'), 'neon');
    expect(base.onChangeQuery).toHaveBeenCalledWith('neon');
    fireEvent.press(screen.getByTestId('video-detail-search-close'));
    expect(base.onCloseSearch).toHaveBeenCalledTimes(1);
  });
});
