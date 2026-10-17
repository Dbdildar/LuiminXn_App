import {fireEvent, render, screen} from '@testing-library/react-native';
import {CollapsingSearchHeader} from '../../../src/screens/Home/components';

const base = {
  query: '',
  onChangeQuery: jest.fn(),
  onExpand: jest.fn(),
  onSubmit: jest.fn(),
  topInset: 24,
};

beforeEach(() => jest.clearAllMocks());

describe('CollapsingSearchHeader', () => {
  it('always shows the logo with the app name', () => {
    const {rerender} = render(<CollapsingSearchHeader {...base} expanded />);
    expect(screen.getByTestId('home-logo')).toBeOnTheScreen();
    expect(screen.getByLabelText(/LuminXn/)).toBeOnTheScreen();

    rerender(<CollapsingSearchHeader {...base} expanded={false} />);
    expect(screen.getByTestId('home-logo')).toBeOnTheScreen();
  });

  it('expanded: shows the search field with its placeholder', () => {
    render(<CollapsingSearchHeader {...base} expanded />);
    const input = screen.getByTestId('home-search-input');
    expect(input.props.placeholder).toBe('Search by title, category or actor…');
    expect(input.props.editable).toBe(true);
    expect(screen.getByTestId('home-search-toggle').props.accessibilityState.expanded).toBe(true);
  });

  it('reports typing, submit and clear', () => {
    render(<CollapsingSearchHeader {...base} query="neon" expanded />);
    fireEvent.changeText(screen.getByTestId('home-search-input'), 'neon x');
    expect(base.onChangeQuery).toHaveBeenCalledWith('neon x');

    fireEvent(screen.getByTestId('home-search-input'), 'submitEditing');
    expect(base.onSubmit).toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('home-search-clear'));
    expect(base.onChangeQuery).toHaveBeenCalledWith('');
  });

  it('hides the clear button when the field is empty', () => {
    render(<CollapsingSearchHeader {...base} expanded />);
    expect(screen.queryByTestId('home-search-clear')).toBeNull();
  });

  it('collapsed: the field is not editable and the icon opens the search', () => {
    render(<CollapsingSearchHeader {...base} expanded={false} />);
    expect(screen.getByTestId('home-search-input').props.editable).toBe(false);

    const toggle = screen.getByTestId('home-search-toggle');
    expect(toggle.props.accessibilityLabel).toBe('Open search');
    fireEvent.press(toggle);
    expect(base.onExpand).toHaveBeenCalledTimes(1);
  });

  it('collapsed with an active query: shows a dot on the icon', () => {
    render(<CollapsingSearchHeader {...base} query="neon" expanded={false} />);
    expect(screen.getByTestId('home-search-active-dot')).toBeOnTheScreen();
  });
});
