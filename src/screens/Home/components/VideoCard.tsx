import { memo, useEffect, useRef } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { VideoItem } from '../../../features/videos';
import { useViewCount } from '../../../features/videos/viewsStore';
import { colors, fonts } from '../../../theme';
import { glass } from '../../../theme/glass';
import { formatDuration, formatViews } from '../../../features/videos/format';

type Props = {
  video: VideoItem;
  width: number;
  onOpen: (video: VideoItem) => void;
  /** Shown as a badge on trending cards. */
  rank?: number;
};

/** Thumbnail height = width * ratio. Shared with the skeleton in TrendingRail. */
export const CARD_THUMB_RATIO = 1.5;



const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

function getMetrics(width: number) {
  const titleSize = clamp(Math.round(width * 0.08), 12, 16);
  const metaSize = clamp(Math.round(width * 0.065), 10, 13);
  return {
    titleSize,
    titleLine: Math.round(titleSize * 1.25),
    metaSize,
    metaLine: Math.round(metaSize * 1.3),
    badgeSize: clamp(Math.round(width * 0.065), 10, 13),
    badgePad: clamp(Math.round(width * 0.035), 4, 8),
  };
}

export function getCaptionHeight(width: number) {
  const m = getMetrics(width);
  return 8 + m.titleLine * 2 + 2 + m.metaLine + 2 + m.metaLine;
}

/**
 * Touch behaviour:
 *  - tap                  → stops any preview and opens VideoDetailScreen
 *  - hold (~200ms)        → starts this card's muted preview (only one at a time)
 *  - release after hold   → preview keeps playing
 *  - scrolling            → stops it (HomeScreen/TrendingRail call stopPreview)
 */
export const VideoCard = memo(function VideoCard({ video, width, onOpen, rank }: Props) {
  const views = useViewCount(video.id, video.views);

  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue:   0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
    
  }, [ lift]);

  
  const handlePress = () => {
    
    onOpen(video);
  };

  const m = getMetrics(width);
  const thumbHeight = Math.round(width * CARD_THUMB_RATIO);
  const duration = video.durationSeconds ? formatDuration(video.durationSeconds) : '';

    const transform = [
    { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
    { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
  ];

  return (
    <Pressable
      testID="video-card"
      onPress={handlePress}
    
      style={{ width }}
      accessibilityRole="button"
      accessibilityLabel={`${video.title}${ 'tap to play'}`}>
      <Animated.View style={[styles.shadow,  { width, height: thumbHeight, transform }]}>
        <View style={styles.face}>
          <Image source={{ uri: video.poster }} style={StyleSheet.absoluteFill} resizeMode="cover" />
         
          {rank !== undefined && (
            <View style={styles.rank} pointerEvents="none">
              <Text style={styles.rankText}>{rank}</Text>
            </View>
          )}

          {duration !== '' && (
            <View
              style={[styles.duration, { right: m.badgePad, bottom: m.badgePad }]}
              pointerEvents="none"
              testID="video-card-duration">
              <Text style={[styles.durationText, { fontSize: m.badgeSize }]}>{duration}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <View style={[styles.caption, { height: getCaptionHeight(width) }]} pointerEvents="none">
        <Text
          style={[styles.title, { fontSize: m.titleSize, lineHeight: m.titleLine }]}
          numberOfLines={2}
          maxFontSizeMultiplier={1.2}>
          {video.title}
        </Text>
        <Text style={[styles.views, { fontSize: m.metaSize }]} testID="video-card-views">
          {formatViews(views)} views
        </Text>
      </View>
    </Pressable>
  );
});

// styles unchanged
const styles = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    backgroundColor: colors.ink,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  glow: { shadowColor: colors.neon, shadowOpacity: 0.75, shadowRadius: 18, elevation: 14 },
  face: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.45)',
  },
  caption: { paddingTop: 8, paddingHorizontal: 2, gap: 2 },
  title: { color: colors.filament, fontFamily: fonts.black },
  views: { color: colors.mist, fontFamily: fonts.medium },
  hint: { color: colors.neon, fontFamily: fonts.medium },
  duration: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  durationText: { color: '#fff', fontFamily: fonts.black },
  rank: {
    position: 'absolute',
    top: 6,
    left: 6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neon,
  },
  rankText: { color: colors.ink, fontFamily: fonts.black, fontSize: 12 },
});

export default VideoCard;