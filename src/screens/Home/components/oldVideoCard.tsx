import {memo, useEffect, useRef, useState} from 'react';
import {Animated, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import Video from 'react-native-video';
import {Icon} from '../../../components/icons';
import {usePreview} from '../../../features/preview';
import type {VideoItem} from '../../../features/videos';
import {colors, fonts} from '../../../theme';
import {glass} from '../../../theme/glass';
import {formatDuration, formatViews} from '../../../utils/format';
import {HOME} from '../oldhomeConfig';
import {PreviewLoader} from '../../../features/preview/PreviewLoader';

type Props = {
  video: VideoItem;
  width: number;
  /** Shown as a rank badge (Trending). */
  rank?: number;
  onOpen: (video: VideoItem) => void;
};

function VideoCardBase({video, width, rank, onOpen}: Props) {
  const {previewId, startPreview, stopPreview} = usePreview();
  const previewing = previewId === video.id;
  const [ready, setReady] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const height = Math.round(width * HOME.grid.cardAspect);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: previewing ? 1.04 : 1,
      friction: 7,
      useNativeDriver: true,
    }).start();
    if (!previewing) {
      setReady(false);
    }
  }, [previewing, scale]);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: ready ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [ready, fade]);

  const showingClip = previewing && ready;
  const meta = `${video.category}, ${formatDuration(video.durationSeconds)}, ${formatViews(video.views)} views`;

  return (
    <Animated.View style={{width, transform: [{scale}], zIndex: previewing ? 5 : 0}}>
      <Pressable
        testID="video-card"
        onPress={() => onOpen(video)}
        onLongPress={() => startPreview(video.id)}
        delayLongPress={HOME.preview.longPressMs}
        onPressOut={() => stopPreview(video.id)}
        accessibilityRole="button"
        accessibilityLabel={`${video.title}. ${meta}`}
        accessibilityHint="Double tap to open. Press and hold to preview."
        accessibilityActions={[{name: 'longpress', label: 'Preview'}]}
        onAccessibilityAction={e => {
          if (e.nativeEvent.actionName === 'longpress') {
            startPreview(video.id);
          }
        }}
        style={[styles.card, {width, height}]}>
        <View style={[StyleSheet.absoluteFill, styles.posterBg]}>
          {!posterFailed && !!video.poster && (
            <Image
              source={{uri: video.poster}}
              resizeMode="cover"
              style={StyleSheet.absoluteFill}
              onError={() => setPosterFailed(true)}
              testID="video-card-poster"
            />
          )}
        </View>

        {previewing && (
          <Animated.View style={[StyleSheet.absoluteFill, {opacity: fade}]} pointerEvents="none">
            <Video
              source={{uri: video.videoUrl}}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              muted
              repeat
              playInBackground={false}
              onReadyForDisplay={() => setReady(true)}
              onError={() => stopPreview(video.id)}
            />
          </Animated.View>
        )}

        {previewing && !ready && <PreviewLoader />}

        {!showingClip && (
          <>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="cardScrim" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0.45" stopColor="#000" stopOpacity="0" />
                  <Stop offset="1" stopColor="#000" stopOpacity="0.88" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#cardScrim)" />
            </Svg>

            {rank !== undefined && (
              <View style={styles.rank} testID="video-card-rank">
                <Text style={styles.rankText}>{rank}</Text>
              </View>
            )}

            <View style={styles.duration}>
              <Text style={styles.durationText}>{formatDuration(video.durationSeconds)}</Text>
            </View>

            <View style={styles.meta}>
              <Text style={styles.category} numberOfLines={1}>
                {video.category}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {video.title}
              </Text>
              <View style={styles.statsRow}>
                <Icon name="eye" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.stat}>{formatViews(video.views)}</Text>
                {video.actors[0] ? (
                  <Text style={[styles.stat, styles.actor]} numberOfLines={1}>
                    {video.actors[0]}
                  </Text>
                ) : null}
              </View>
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

export const VideoCard = memo(VideoCardBase);

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: glass.surface,
    shadowColor: glass.shadow,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 10},
    elevation: 6,
  },
  posterBg: {backgroundColor: colors.dusk},
  rank: {
    position: 'absolute',
    top: 8,
    left: 8,
    minWidth: 28,
    height: 28,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  rankText: {color: '#fff', fontFamily: fonts.black, fontSize: 12},
  duration: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  durationText: {color: '#fff', fontFamily: fonts.medium, fontSize: 10},
  meta: {position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10},
  category: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {color: '#fff', fontFamily: fonts.black, fontSize: 13, lineHeight: 17},
  statsRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4},
  stat: {color: 'rgba(255,255,255,0.8)', fontFamily: fonts.medium, fontSize: 10},
  actor: {flex: 1, marginLeft: 6},
});
