import NetInfo from '@react-native-community/netinfo';
import {useEffect, useState} from 'react';

/** true when the device reports no connection / no internet. Never throws. */
export function useIsOffline() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    const apply = (s: any) => {
      if (alive) setOffline(s?.isConnected === false || s?.isInternetReachable === false);
    };
    let unsubscribe: (() => void) | undefined;
    try {
      Promise.resolve(NetInfo.fetch?.()).then(apply).catch(() => {});
      const u = NetInfo.addEventListener(apply);
      if (typeof u === 'function') unsubscribe = u;
    } catch {
      // NetInfo unavailable: assume online
    }
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  return offline;
}
