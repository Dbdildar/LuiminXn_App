import NetInfo from '@react-native-community/netinfo';
import {act, renderHook, waitFor} from '@testing-library/react-native';
import {
  statusFromState,
  useNetworkStatus,
} from '../../../src/features/network/useNetworkStatus';

const state = (isConnected: boolean | null, isInternetReachable: boolean | null) =>
  ({isConnected, isInternetReachable}) as any;

const fetchMock = NetInfo.fetch as jest.Mock;
const refreshMock = NetInfo.refresh as jest.Mock;
const listenMock = NetInfo.addEventListener as jest.Mock;

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(state(true, true));
  refreshMock.mockReset().mockResolvedValue(state(true, true));
  listenMock.mockReset().mockReturnValue(jest.fn());
});

describe('statusFromState', () => {
  it.each([
    [state(null, null), 'checking'],
    [state(false, false), 'offline'],
    [state(true, false), 'offline'],
    [state(true, null), 'online'],
    [state(true, true), 'online'],
  ])('%j -> %s', (input, expected) => {
    expect(statusFromState(input)).toBe(expected);
  });
});

describe('useNetworkStatus', () => {
  it('starts as checking and becomes online', async () => {
    const {result} = renderHook(() => useNetworkStatus());
    expect(result.current.status).toBe('checking');
    await waitFor(() => expect(result.current.status).toBe('online'));
  });

  it('is offline when there is no connection', async () => {
    fetchMock.mockResolvedValue(state(false, false));
    const {result} = renderHook(() => useNetworkStatus());
    await waitFor(() => expect(result.current.status).toBe('offline'));
  });

  it('assumes online if NetInfo itself fails', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));
    const {result} = renderHook(() => useNetworkStatus());
    await waitFor(() => expect(result.current.status).toBe('online'));
  });

  it('follows live connection changes', async () => {
    const {result} = renderHook(() => useNetworkStatus());
    await waitFor(() => expect(result.current.status).toBe('online'));

    const listener = listenMock.mock.calls[0][0];
    act(() => listener(state(false, false)));
    expect(result.current.status).toBe('offline');
    act(() => listener(state(true, true)));
    expect(result.current.status).toBe('online');
  });

  it('retry re-checks and updates the status', async () => {
    fetchMock.mockResolvedValue(state(false, false));
    const {result} = renderHook(() => useNetworkStatus());
    await waitFor(() => expect(result.current.status).toBe('offline'));

    await act(async () => {
      await result.current.retry();
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('online');
    expect(result.current.retrying).toBe(false);
  });

  it('retry survives a failing refresh', async () => {
    fetchMock.mockResolvedValue(state(false, false));
    refreshMock.mockRejectedValue(new Error('nope'));
    const {result} = renderHook(() => useNetworkStatus());
    await waitFor(() => expect(result.current.status).toBe('offline'));

    await act(async () => {
      await result.current.retry();
    });

    expect(result.current.status).toBe('offline');
    expect(result.current.retrying).toBe(false);
  });

  it('unsubscribes on unmount', async () => {
    const unsubscribe = jest.fn();
    listenMock.mockReturnValue(unsubscribe);
    const {unmount} = renderHook(() => useNetworkStatus());
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });
});
