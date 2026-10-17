import NetInfo, {type NetInfoState} from '@react-native-community/netinfo';
import {useCallback, useEffect, useRef, useState} from 'react';

export type NetworkStatus = 'checking' | 'online' | 'offline';

export function statusFromState(state: NetInfoState): NetworkStatus {
  if (state.isConnected === null || state.isConnected === undefined) {
    return 'checking';
  }
  // isInternetReachable is null until the first probe finishes: trust isConnected.
  if (!state.isConnected || state.isInternetReachable === false) {
    return 'offline';
  }
  return 'online';
}

/**
 * Tracks connectivity. Started in App so the answer is ready by the time the
 * splash ends. Never throws; if NetInfo itself fails we assume online and let
 * the data layer report real failures.
 */
export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>('checking');
  const [retrying, setRetrying] = useState(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    NetInfo.fetch()
      .then(s => active.current && setStatus(statusFromState(s)))
      .catch(() => active.current && setStatus('online'));
    const unsubscribe = NetInfo.addEventListener(s => {
      if (active.current) {
        setStatus(statusFromState(s));
      }
    });
    return () => {
      active.current = false;
      unsubscribe();
    };
  }, []);

  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      const s = await NetInfo.refresh();
      if (active.current) {
        setStatus(statusFromState(s));
      }
    } catch {
      // Stay offline; the user can try again.
    } finally {
      if (active.current) {
        setRetrying(false);
      }
    }
  }, []);

  return {status, retrying, retry};
}
