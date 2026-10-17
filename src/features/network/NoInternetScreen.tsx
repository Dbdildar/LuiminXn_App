import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import {Icon} from '../../components/icons';
import {colors, fontSizes, fonts} from '../../theme';
import {glass} from '../../theme/glass';

type Props = {onRetry: () => void; retrying?: boolean};

export const NO_INTERNET_COPY = {
  title: 'Your internet is not connected',
  body: 'Please check your Wi-Fi or mobile data, then try again.',
  retry: 'Try again',
} as const;

export function NoInternetScreen({onRetry, retrying = false}: Props) {
  return (
    <View style={styles.root} testID="no-internet-screen">
      <View style={styles.card}>
        <View style={styles.badge}>
          <Icon name="wifi-off" size={30} color={colors.neon} />
        </View>
        <Text
          style={styles.title}
          accessibilityRole="header"
          accessibilityLiveRegion="polite">
          {NO_INTERNET_COPY.title}
        </Text>
        <Text style={styles.body}>{NO_INTERNET_COPY.body}</Text>
        <Pressable
          testID="no-internet-retry"
          accessibilityRole="button"
          accessibilityLabel={NO_INTERNET_COPY.retry}
          accessibilityState={{disabled: retrying, busy: retrying}}
          disabled={retrying}
          onPress={onRetry}
          style={({pressed}) => [styles.button, pressed && styles.pressed]}>
          {retrying ? (
            <ActivityIndicator color={colors.filament} />
          ) : (
            <Text style={styles.buttonText}>{NO_INTERNET_COPY.retry}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.ink,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: colors.dusk,
    elevation: 12,
  },
  badge: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.neon,
  },
  title: {
    marginTop: 20,
    color: colors.filament,
    fontFamily: fonts.medium,
    fontSize: fontSizes.title,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    marginBottom: 24,
    color: colors.mist,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
    lineHeight: 23,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.neon,
  },
  buttonText: {
    color: colors.filament,
    fontFamily: fonts.medium,
    fontSize: fontSizes.body,
  },
  pressed: {opacity: 0.75},
});
