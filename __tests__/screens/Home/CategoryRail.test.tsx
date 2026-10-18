import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { CategoryRail, splitRows } from '../../../src/screens/Home/components/CategoryRail';

const cats = ['Action', 'Drama', 'Comedy', 'Horror'];

describe('splitRows', () => {
  it('deals items alternately', () => {
    expect(splitRows(['a', 'b', 'c', 'd', 'e'], 2)).toEqual([['a', 'c', 'e'], ['b', 'd']]);
  });
  it('handles fewer items than rows', () => {
    expect(splitRows(['a'], 2)).toEqual([['a'], []]);
  });
});

describe('CategoryRail', () => {
  const setup = (over: Partial<React.ComponentProps<typeof CategoryRail>> = {}) => {
    const onSelect = jest.fn();
    render(<CategoryRail categories={cats} active="All" loading={false} onSelect={onSelect} {...over} />);
    return { onSelect };
  };

  it('renders two rows with All first', () => {
    setup();
    const row0 = within(screen.getByTestId('category-row-0'));
    const row1 = within(screen.getByTestId('category-row-1'));
    expect(row0.getByTestId('category-All')).toBeOnTheScreen();
    expect(row0.getByTestId('category-Drama')).toBeOnTheScreen();
    expect(row0.getByTestId('category-Horror')).toBeOnTheScreen();
    expect(row1.getByTestId('category-Action')).toBeOnTheScreen();
    expect(row1.getByTestId('category-Comedy')).toBeOnTheScreen();
  });

  it('keeps both rows inside ONE horizontal scroll view so they scroll together', () => {
    setup();
    const scroll = screen.getByTestId('category-scroll');
    expect(scroll.props.horizontal).toBe(true);
    const inside = within(scroll);
    expect(inside.getByTestId('category-row-0')).toBeOnTheScreen();
    expect(inside.getByTestId('category-row-1')).toBeOnTheScreen();
  });

  it('marks only the active chip as selected', () => {
    setup({ active: 'Drama' });
    expect(screen.getByTestId('category-Drama').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('category-All').props.accessibilityState.selected).toBe(false);
  });

  it('calls onSelect with the pressed category', () => {
    const { onSelect } = setup();
    fireEvent.press(screen.getByTestId('category-Comedy'));
    expect(onSelect).toHaveBeenCalledWith('Comedy');
  });

  it('shows shimmer placeholders in both rows while loading', () => {
    setup({ categories: [], loading: true });
    expect(
      within(screen.getByTestId('category-row-0')).getAllByTestId('shimmer', { includeHiddenElements: true }).length,
    ).toBeGreaterThan(0);
    expect(
      within(screen.getByTestId('category-row-1')).getAllByTestId('shimmer', { includeHiddenElements: true }).length,
    ).toBeGreaterThan(0);
  });
});
