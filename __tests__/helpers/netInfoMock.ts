/**
 * Controllable NetInfo. Use:
 *   jest.mock('@react-native-community/netinfo', () => require('<path>/__tests__/helpers/netInfoMock').netInfoModule);
 */
type Listener = (s: any) => void;
const online = { isConnected: true, isInternetReachable: true };
const offline = { isConnected: false, isInternetReachable: false };
const listeners = new Set<Listener>();
let state: any = online;

export const netInfo = {
  online,
  offline,
  set(next: any) {
    state = next;
    listeners.forEach(l => l(next));
  },
  reset() {
    state = online;
    listeners.clear();
  },
};

export const netInfoModule = {
  __esModule: true,
  default: {
    fetch: async () => state,
    addEventListener: (l: Listener) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
  },
};
