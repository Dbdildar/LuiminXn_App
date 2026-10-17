import {useRef, type ReactNode} from 'react';
import {StyleSheet, View} from 'react-native';
import {colors} from '../../theme';
import {NoInternetScreen} from './NoInternetScreen';
import type {NetworkStatus} from './useNetworkStatus';

type Props = {
  status: NetworkStatus;
  retrying: boolean;
  onRetry: () => void;
  children: ReactNode;
};

/**
 * Shows "Your internet is not connected" instead of the app when offline.
 * After the app has been online once, the children stay mounted underneath
 * the offline screen so the user's place (scroll, search, page) is not lost.
 */
export function NetworkGate({status, retrying, onRetry, children}: Props) {
  const hasBeenOnline = useRef(false);
  if (status === 'online') {
    hasBeenOnline.current = true;
  }

  if (status === 'checking' && !hasBeenOnline.current) {
    return <View style={styles.dark} testID="network-checking" />;
  }

  const showChildren = status !== 'offline' || hasBeenOnline.current;

  return (
    <View style={styles.root}>
      {showChildren ? children : null}
      {status === 'offline' && (
        <View style={StyleSheet.absoluteFill}>
          <NoInternetScreen onRetry={onRetry} retrying={retrying} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.ink},
  dark: {flex: 1, backgroundColor: colors.ink},
});
