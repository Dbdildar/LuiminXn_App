import AsyncStorage from '@react-native-async-storage/async-storage';
import {act, renderHook} from '@testing-library/react-native';
import {BackHandler} from 'react-native';
import {STORAGE_KEY} from '../../../src/features/ageGate/ageGateConfig';
import {
  readAgeVerification,
  saveAgeVerification,
} from '../../../src/features/ageGate/ageGateStorage';
import {useAgeGate} from '../../../src/features/ageGate/useAgeGate';
import {flushPromises} from '../../helpers/motion';

describe('useAgeGate', () => {
  let exitApp: jest.SpyInstance;

  beforeEach(() => {
    exitApp = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts as "checking" until the saved answer has been read', async () => {
    const {result} = renderHook(() => useAgeGate());

    expect(result.current.status).toBe('checking');
    await flushPromises();
  });

  it('is "required" for a first-time user', async () => {
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    expect(result.current.status).toBe('required');
  });

  it('is "verified" for a user who already confirmed', async () => {
    await saveAgeVerification();

    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    expect(result.current.status).toBe('verified');
  });

  it('is "required" (fails closed) when the saved answer cannot be read', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
      new Error('disk error'),
    );

    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    expect(result.current.status).toBe('required');
  });

  it('confirm: lets the user in and saves the answer', async () => {
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    await act(async () => result.current.confirm());

    expect(result.current.status).toBe('verified');
    expect(await readAgeVerification()).toBe(true);
    expect(exitApp).not.toHaveBeenCalled();
  });

  it('confirm: still lets the user in if the answer cannot be saved', async () => {
    (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
      new Error('disk full'),
    );
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    await act(async () => result.current.confirm());

    expect(result.current.status).toBe('verified');
    expect(await readAgeVerification()).toBe(false);
  });

  it('confirm: saves only once, even if called twice', async () => {
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();
    (AsyncStorage.setItem as jest.Mock).mockClear();

    await act(async () => {
      result.current.confirm();
      result.current.confirm();
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it('decline: closes the app and saves nothing', async () => {
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    await act(async () => result.current.decline());

    expect(exitApp).toHaveBeenCalledTimes(1);
    expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(result.current.status).toBe('required');
  });

  it('decline: can be used again and again (the app may stay alive after closing)', async () => {
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    await act(async () => result.current.decline());
    await act(async () => result.current.decline());

    expect(exitApp).toHaveBeenCalledTimes(2);
  });

  it('confirm: still works after a Cancel (user reopened the app and changed their mind)', async () => {
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    await act(async () => result.current.decline());
    await act(async () => result.current.confirm());

    expect(result.current.status).toBe('verified');
    expect(await readAgeVerification()).toBe(true);
  });

  it('decline: does nothing once the age has been confirmed', async () => {
    const {result} = renderHook(() => useAgeGate());
    await flushPromises();

    await act(async () => result.current.confirm());
    await act(async () => result.current.decline());

    expect(exitApp).not.toHaveBeenCalled();
  });

  it('a confirm tap during the first read is not overwritten by the read result', async () => {
    const {result} = renderHook(() => useAgeGate());

    // Tap confirm before the (empty) storage read has finished.
    await act(async () => {
      result.current.confirm();
    });

    expect(result.current.status).toBe('verified');
  });

  it('ignores a read that finishes after unmount', async () => {
    let resolveRead: (value: string | null) => void = () => {};
    (AsyncStorage.getItem as jest.Mock).mockReturnValueOnce(
      new Promise<string | null>(resolve => {
        resolveRead = resolve;
      }),
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const {unmount} = renderHook(() => useAgeGate());
    unmount();
    await act(async () => resolveRead(null));

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('gives the same callbacks on every render (safe to pass down)', async () => {
    const {result, rerender} = renderHook(() => useAgeGate());
    await flushPromises();
    const {confirm, decline} = result.current;

    rerender({});

    expect(result.current.confirm).toBe(confirm);
    expect(result.current.decline).toBe(decline);
  });
});
