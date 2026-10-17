import { fireEvent, render, screen } from '@testing-library/react-native';
import { CategoryRail } from '../../../src/screens/Home/components';

describe('CategoryRail', () => {
  const categories = ['Action', 'Drama'];

  it('shows "All" first, then the categories', () => {
    render(<CategoryRail categories={categories} active="All" loading={false} onSelect={jest.fn()} />);
    expect(screen.getByTestId('category-All')).toBeOnTheScreen();
    expect(screen.getByTestId('category-Action')).toBeOnTheScreen();
    expect(screen.getByTestId('category-Drama')).toBeOnTheScreen();
  });

  it('marks only the active one as selected', () => {
    render(<CategoryRail categories={categories} active="All" loading={false} onSelect={jest.fn()} />);
    expect(screen.getByTestId('category-All').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('category-Action').props.accessibilityState.selected).toBe(false);
  });

  it('moves the selection when the active category changes', () => {
    const { rerender } = render(
      <CategoryRail categories={categories} active="All" loading={false} onSelect={jest.fn()} />,
    );
    rerender(<CategoryRail categories={categories} active="Drama" loading={false} onSelect={jest.fn()} />);
    expect(screen.getByTestId('category-Drama').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('category-All').props.accessibilityState.selected).toBe(false);
  });

  it('reports the tapped category', () => {
    const onSelect = jest.fn();
    render(<CategoryRail categories={categories} active="All" loading={false} onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId('category-Action'));
    expect(onSelect).toHaveBeenCalledWith('Action');
  });

  it('shows shimmer chips after "All" while loading', () => {
    render(<CategoryRail categories={[]} active="All" loading onSelect={jest.fn()} />);

    expect(screen.getByTestId('category-All')).toBeOnTheScreen();
    // Shimmers are hidden from screen readers on purpose, so include hidden elements.
    expect(
      screen.getAllByTestId('shimmer', { includeHiddenElements: true }).length,
    ).toBeGreaterThan(0);
  });

  it('shows no shimmer chips once loaded', () => {
    render(<CategoryRail categories={categories} active="All" loading={false} onSelect={jest.fn()} />);
    expect(screen.queryAllByTestId('shimmer', { includeHiddenElements: true })).toHaveLength(0);
  });
});