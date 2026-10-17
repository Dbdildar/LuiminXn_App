import NetInfo from '@react-native-community/netinfo';
import {QueryClient, onlineManager} from '@tanstack/react-query';

let wired = false;

/** Lets react-query pause / refetch when the phone loses or regains connection. */
function wireOnlineManager() {
  if (wired) {
    return;
  }
  wired = true;
  onlineManager.setEventListener(setOnline =>
    NetInfo.addEventListener(state => setOnline(state.isConnected !== false)),
  );
}

export function createQueryClient(): QueryClient {
  wireOnlineManager();
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        retryDelay: attempt => Math.min(1000 * 2 ** attempt, 4000),
        staleTime: 30_000,
      },
    },
  });
}
