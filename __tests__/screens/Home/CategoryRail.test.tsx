import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {CategoryRail} from '../../../src/screens/Home/components/CategoryRail';

describe('CategoryRail', () => {
  const mockCategories = ['Tech', 'Gaming', 'Music'];
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "All" and the provided categories', () => {
    const {getByTestId} = render(
      <CategoryRail
        categories={mockCategories}
        active="All"
        loading={false}
        onSelect={mockOnSelect}
      />,
    );

    expect(getByTestId('category-All')).toBeTruthy();
    expect(getByTestId('category-Tech')).toBeTruthy();
    expect(getByTestId('category-Gaming')).toBeTruthy();
    expect(getByTestId('category-Music')).toBeTruthy();
  });

  it('triggers onSelect with the correct category when pressed', () => {
    const {getByTestId} = render(
      <CategoryRail
        categories={mockCategories}
        active="All"
        loading={false}
        onSelect={mockOnSelect}
      />,
    );

    fireEvent.press(getByTestId('category-Gaming'));
    expect(mockOnSelect).toHaveBeenCalledWith('Gaming');
  });

  it('highlights the active category correctly', () => {
    const {getByTestId} = render(
      <CategoryRail
        categories={mockCategories}
        active="Tech"
        loading={false}
        onSelect={mockOnSelect}
      />,
    );

    const techPill = getByTestId('category-Tech');
    expect(techPill.props.accessibilityState).toEqual({selected: true});

    const allPill = getByTestId('category-All');
    expect(allPill.props.accessibilityState).toEqual({selected: false});
  });

  it('renders loading shimmers when loading is true', () => {
    const {toJSON} = render(
      <CategoryRail
        categories={[]}
        active="All"
        loading={true}
        onSelect={mockOnSelect}
      />,
    );

    expect(toJSON()).toBeTruthy();
  });
});