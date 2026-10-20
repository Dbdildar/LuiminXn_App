import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Icon} from './Icon';
import {PLAYER} from './playerConfig';

type Props = {
  variant: 'network' | 'playback';
  onRetry: () => void;
};

const COPY = {
  network: {
    icon: 'wifi-off' as const,
    title: 'No internet connection',
    body: 'Check your connection. We’ll resume where you left off.',
  },
  playback: {
    icon: 'alert-circle' as const,
    title: 'Couldn’t play this video',
    body: 'Something went wrong while loading it.',
  },
};

export function PlayerError({variant, onRetry}: Props) {
  const c = COPY[variant];
  return (
    <View style={styles.box} testID="player-error">
      <Icon name={c.icon} size={34} />
      <Text style={styles.title} testID="player-error-title">
        {c.title}
      </Text>
      <Text style={styles.body}>{c.body}</Text>
      <Pressable
        testID="player-retry"
        accessibilityRole="button"
        accessibilityLabel="Try again"
        onPress={onRetry}
        style={({pressed}) => [styles.retry, pressed && {opacity: 0.8}]}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, backgroundColor: 'rgba(0,0,0,0.88)'},
  title: {color: '#fff', fontSize: 15, fontWeight: '800', textAlign: 'center'},
  body: {color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center'},
  retry: {marginTop: 6, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, backgroundColor: PLAYER.accent},
  retryText: {color: '#fff', fontWeight: '800'},
});
