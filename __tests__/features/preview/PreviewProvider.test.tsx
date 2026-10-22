import {act, renderHook} from '@testing-library/react-native';
import {PreviewProvider, usePreview} from '../../../src/features/preview/PreviewProvider';

const wrapper = ({children}: {children: React.ReactNode}) => (
  <PreviewProvider>{children}</PreviewProvider>
);

it('starts a preview', () => {
  const {result} = renderHook(() => usePreview(), {wrapper});
  act(() => result.current.startPreview('a'));
  expect(result.current.previewId).toBe('a');
});

it('only one preview at a time', () => {
  const {result} = renderHook(() => usePreview(), {wrapper});
  act(() => result.current.startPreview('a'));
  act(() => result.current.startPreview('b'));
  expect(result.current.previewId).toBe('b');
});

it('stopPreview(id) ignores a different id; stopPreview() clears', () => {
  const {result} = renderHook(() => usePreview(), {wrapper});
  act(() => result.current.startPreview('a'));
  act(() => result.current.stopPreview('b'));
  expect(result.current.previewId).toBe('a');
  act(() => result.current.stopPreview());
  expect(result.current.previewId).toBeNull();
});

it('keeps stable function identities across renders', () => {
  const {result} = renderHook(() => usePreview(), {wrapper});
  const {startPreview, stopPreview} = result.current;
  act(() => result.current.startPreview('a'));
  expect(result.current.startPreview).toBe(startPreview);
  expect(result.current.stopPreview).toBe(stopPreview);
});

it('works without a provider (disabled, no crash)', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const {result} = renderHook(() => usePreview());
  expect(() => result.current.startPreview('a')).not.toThrow();
  expect(result.current.previewId).toBeNull();
});