import { act, renderHook } from '@testing-library/react-native';
import { useDebouncedValue } from '../../src/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

 it('only updates after the delay and uses the last value', () => {
    const { result, rerender } = renderHook(
      ({ v }: { v: string }) => useDebouncedValue(v, 300),
      {
        initialProps: { v: 'initialValue' },
      }
    );

    // Update with 'a'
    rerender({ v: 'a' });
    
    // ❌ Don't assert immediately — the debounce delay hasn't passed!
    // expect(result.current).toBe('a'); 

    // ✅ Advance timers by the debounce delay first
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a');
  });
});
