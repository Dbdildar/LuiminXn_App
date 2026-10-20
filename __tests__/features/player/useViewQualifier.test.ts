import { act, renderHook } from '@testing-library/react-native';
import { useViewQualifier } from '../../../src/features/player/useViewQualifier';

const playFor = (tick: (t: number, p: boolean) => void, from: number, to: number, step = 0.25) => {
  for (let t = from; t <= to + 1e-9; t += step) act(() => tick(t, true));
};

describe('useViewQualifier', () => {
  it('fires once after 5 seconds of real playback', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useViewQualifier('v1', cb));
    playFor(result.current.tick, 0, 4.5);
    expect(cb).not.toHaveBeenCalled();
    playFor(result.current.tick, 4.75, 9);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('ignores time while paused', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useViewQualifier('v1', cb, 1));
    for (let t = 0; t < 10; t += 0.25) act(() => result.current.tick(t, false));
    expect(cb).not.toHaveBeenCalled();
  });

  it('does not count a seek jump as watch time', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useViewQualifier('v1', cb, 1));
    act(() => result.current.tick(0, true));
    act(() => result.current.tick(60, true)); // jump
    expect(cb).not.toHaveBeenCalled();
  });

  it('markSeek discards the next delta', () => {
    const cb = jest.fn();
    const { result } = renderHook(() => useViewQualifier('v1', cb, 0.25));
    act(() => result.current.tick(0, true));
    act(() => result.current.markSeek());
    act(() => result.current.tick(0.25, true)); // first tick after seek has no previous
    expect(cb).not.toHaveBeenCalled();
    act(() => result.current.tick(0.5, true));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('starts over for a different video', () => {
    const cb = jest.fn();
    const { result, rerender } = renderHook(({ id }: { id: string }) => useViewQualifier(id, cb, 1), {
      initialProps: { id: 'a' },
    });
    playFor(result.current.tick, 0, 2);
    expect(cb).toHaveBeenCalledTimes(1);
    rerender({ id: 'b' });
    playFor(result.current.tick, 0, 2);
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
