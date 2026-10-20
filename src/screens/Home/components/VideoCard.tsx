import {memo, useCallback, useEffect, useRef, useState} from 'react';
import {Animated, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {PreviewLoader, PreviewPlayer, usePreview} from '../../../features/preview';
import type {VideoItem} from '../../../features/videos';
import {colors, fonts} from '../../../theme';
import {glass} from '../../../theme/glass';
import {formatViews} from '../../../features/videos/format';
import {HOME} from '../homeConfig';

type Props = {
  video: VideoItem;
  width: number;
  onOpen: (video: VideoItem) => void;
  /** Shown as a badge on trending cards. */
  rank?: number;
};

/**
 * Touch behaviour:
 *  - touch held for ~90ms (or a quick tap) -> preview starts immediately
 *  - releasing the finger does NOT stop the preview
 *  - scrolling stops it (HomeScreen calls stopPreview on scroll begin)
 *  - tapping a card whose preview is already playing opens the video
 */
export const VideoCard = memo(function VideoCard({video, width, onOpen, rank}: Props) {
  const {previewId, startPreview, stopPreview} = usePreview();
  const isActive = previewId === video.id;
  const [ready, setReady] = useState(false);

  const lift = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedByTouch = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    Animated.spring(lift, {
      toValue: isActive ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
    if (!isActive) {
      setReady(false);
    }
  }, [isActive, lift]);

  useEffect(() => clearTimer, [clearTimer]);

  const handlePressIn = () => {
    startedByTouch.current = false;
    clearTimer();
    if (isActive) {
      return;
    }
    timer.current = setTimeout(() => {
      startedByTouch.current = true;
      startPreview(video.id);
    }, HOME.preview.touchDelayMs);
  };

  const handlePressOut = () => clearTimer();

  const handlePress = () => {
    clearTimer();
    if (startedByTouch.current) {
      // this same touch already started the preview, so don't open on release
      startedByTouch.current = false;
      return;
    }
    if (isActive) {
      stopPreview(video.id);
      onOpen(video);
      return;
    }
    startPreview(video.id);
  };

  const height = Math.round(width * 1.5);
  const transform = [
    {perspective: 800},
    {rotateX: lift.interpolate({inputRange: [0, 1], outputRange: ['0deg', '-4deg']})},
    {scale: lift.interpolate({inputRange: [0, 1], outputRange: [1, 1.05]})},
    {translateY: lift.interpolate({inputRange: [0, 1], outputRange: [0, -4]})},
  ];

  return (
    <Pressable
      testID="video-card"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${video.title}${isActive ? ', previewing. Tap to open' : ', tap to preview'}`}>
      <Animated.View style={[styles.shadow, isActive && styles.glow, {width, height, transform}]}>
        <View style={styles.face}>
          <Image
            source={{uri: video.poster}}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          {isActive && (
            <View style={StyleSheet.absoluteFill}>
              <PreviewPlayer
                video={video}
                onReady={() => setReady(true)}
                onError={() => stopPreview(video.id)}
              />
              {!ready && <PreviewLoader />}
            </View>
          )}
          <View style={styles.caption} pointerEvents="none">
            <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={1.2}>
              {video.title}
            </Text>
            <Text style={styles.views} testID="video-card-views">
              {formatViews(video.views)} views
            </Text>
            {isActive && <Text style={styles.hint}>Tap to open</Text>}
          </View>
          {rank !== undefined && (
            <View style={styles.rank} pointerEvents="none">
              <Text style={styles.rankText}>{rank}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    backgroundColor: colors.ink,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  glow: {shadowColor: colors.neon, shadowOpacity: 0.75, shadowRadius: 18, elevation: 14},
  face: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.45)',
  },
  caption: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  title: {color: colors.filament, fontFamily: fonts.black, fontSize: 12},
  views: {color: colors.mist, fontFamily: fonts.medium, fontSize: 10, marginTop: 2},
  hint: {color: colors.neon, fontFamily: fonts.medium, fontSize: 10, marginTop: 2},
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
  rankText: {color: colors.ink, fontFamily: fonts.black, fontSize: 12},
});

export default VideoCard;
