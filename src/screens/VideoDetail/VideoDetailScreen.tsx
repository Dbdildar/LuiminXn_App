import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon} from '../../components/icons';
import type {VideoItem} from '../../features/videos';
import {colors, fonts} from '../../theme';
import {glass} from '../../theme/glass';

type Props = {video: VideoItem; onBack: () => void};

/**
 * Placeholder detail page: only the video name and a back button.
 * The player will be added here later (video.videoUrl is already available).
 */
export function VideoDetailScreen({video, onBack}: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, {paddingTop: insets.top + 12}]} testID="video-detail-screen">
      <Pressable
        testID="video-detail-back"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        style={({pressed}) => [styles.back, pressed && {opacity: 0.7}]}>
        <Icon name="arrow-left" size={20} color={colors.filament} />
      </Pressable>

      <View style={styles.center}>
        <View style={styles.card}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            testID="video-detail-title">
            {video.title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, paddingHorizontal: 16, backgroundColor: colors.ink},
  back: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: glass.surfaceStrong,
  },
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80},
  card: {
    width: '100%',
    maxWidth: 520,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: glass.surface,
  },
  title: {
    color: colors.filament,
    fontFamily: fonts.black,
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'center',
  },
});

export default VideoDetailScreen;
