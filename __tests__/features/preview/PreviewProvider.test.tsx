import {act, renderHook} from '@testing-library/react-native';
import {AppState} from 'react-native';
import type {ReactNode} from 'react';
import {PreviewProvider, usePreview} from '../../../src/features/preview';

const wrapper = ({children}: {children: ReactNode}) => <PreviewProvider>{children}</PreviewProvider>;

describe('PreviewProvider', () => {
  it('starts with no preview', () => {
    const {result} = renderHook(() => usePreview(), {wrapper});
    expect(result.current.previewId).toBeNull();
  });

  it('only ever previews one video: starting another replaces the first', () => {
    const {result} = renderHook(() => usePreview(), {wrapper});
    act(() => result.current.startPreview('a'));
    act(() => result.current.startPreview('b'));
    expect(result.current.previewId).toBe('b');
  });

  it('stop(id) ignores a video that is not the one previewing', () => {
    const {result} = renderHook(() => usePreview(), {wrapper});
    act(() => result.current.startPreview('b'));
    act(() => result.current.stopPreview('a'));
    expect(result.current.previewId).toBe('b');
    act(() => result.current.stopPreview('b'));
    expect(result.current.previewId).toBeNull();
  });

  it('stop() with no id always stops', () => {
    const {result} = renderHook(() => usePreview(), {wrapper});
    act(() => result.current.startPreview('a'));
    act(() => result.current.stopPreview());
    expect(result.current.previewId).toBeNull();
  });

  it('stops when the app goes to the background', () => {
    let handler: (s: string) => void = () => {};
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, h: (s: string) => void) => {
      handler = h;
      return {remove: jest.fn()};
    }) as any);

    const {result} = renderHook(() => usePreview(), {wrapper});
    act(() => result.current.startPreview('a'));
    act(() => handler('background'));
    expect(result.current.previewId).toBeNull();
  });

  it('works (as a no-op) outside a provider', () => {
    const {result} = renderHook(() => usePreview());
    expect(() => result.current.startPreview('a')).not.toThrow();
    expect(result.current.previewId).toBeNull();
  });
});
