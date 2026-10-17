import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Icon} from '../../../components/icons';
import {colors, fonts} from '../../../theme';
import {glass} from '../../../theme/glass';

type Props = {error: boolean; onRetry: () => void};

export function EmptyState({error, onRetry}: Props) {
  return (
    <View style={styles.root} testID={error ? 'home-error' : 'home-empty'}>
      <Icon name={error ? 'wifi-off' : 'search'} size={32} color={colors.mist} />
      <Text style={styles.title}>{error ? "Couldn't load the library" : 'No videos found'}</Text>
      <Text style={styles.body}>
        {error
          ? 'The catalogue is unreachable right now. Check your connection and try again.'
          : 'Nothing matches this keyword or category yet.'}
      </Text>
      {error && (
        <Pressable
          testID="home-retry"
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({pressed}) => [styles.button, pressed && {opacity: 0.75}]}>
          <Icon name="refresh" size={16} color={colors.filament} />
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {alignItems: 'center', paddingHorizontal: 32, paddingVertical: 56},
  title: {marginTop: 12, color: colors.filament, fontFamily: fonts.medium, fontSize: 15},
  body: {
    marginTop: 6,
    maxWidth: 300,
    color: colors.mist,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    paddingHorizontal: 18,
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: glass.surfaceStrong,
  },
  buttonText: {color: colors.filament, fontFamily: fonts.medium, fontSize: 13},
});
