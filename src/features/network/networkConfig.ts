import NetInfo from '@react-native-community/netinfo';
import {SUPABASE_URL} from '../../lib/supabase';

/** "Online" means: we can actually reach our backend, not just any website. */
export function configureNetInfo() {
  try {
    NetInfo.configure({
      reachabilityUrl: `${SUPABASE_URL}/rest/v1/`,
      reachabilityTest: async response => response.status < 500,
      reachabilityLongTimeout: 30_000,
      reachabilityShortTimeout: 5_000,
      reachabilityRequestTimeout: 10_000,
    });
  } catch {
    // Default reachability settings are fine as a fallback.
  }
}
