import {act, renderHook} from '@testing-library/react-native';
import {useDebouncedValue} from '../../src/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('only updates after the delay and uses the last value', () => {
    const {result, rerender} = renderHook(({v}) => useDebouncedValue(v, 300), {
      initialProps: {v: 'a'},
    });
    expect(result.current).toBe('a');

    rerender({v: 'ab'});
    act(() => jest.advanceTimersByTime(200));
    rerender({v: 'abc'});
    act(() => jest.advanceTimersByTime(299));
    expect(result.current).toBe('a');

    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe('abc');
  });
});
