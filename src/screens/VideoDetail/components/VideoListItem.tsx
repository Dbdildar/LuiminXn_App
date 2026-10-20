import {memo} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import type {VideoItem} from '../../../features/videos';
import {formatDuration, formatViews} from '../../../features/videos/format';
import {colors, fonts} from '../../../theme';

type Props = {
  video: VideoItem;
  thumbWidth: number;
  isCurrent?: boolean;
  onPress: (video: VideoItem) => void;
};

/** One row: 16:9 poster + title, category and views. Used for similar videos and search results. */
export const VideoListItem = memo(function VideoListItem({video, thumbWidth, isCurrent, onPress}: Props) {
  return (
    <Pressable
      testID="video-list-item"
      accessibilityRole="button"
      accessibilityLabel={`Play ${video.title}`}
      onPress={() => onPress(video)}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.thumb, {width: thumbWidth, height: Math.round((thumbWidth * 9) / 16)}]}>
        <Image source={{uri: video.poster}} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.duration}>
          <Text style={styles.durationText}>{formatDuration(video.durationSeconds)}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={1.3}>
          {video.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {video.category} · {formatViews(video.views)} views
        </Text>
        {isCurrent && <Text style={styles.now}>Now playing</Text>}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingVertical: 8},
  pressed: {opacity: 0.7},
  thumb: {borderRadius: 10, overflow: 'hidden', backgroundColor: '#111'},
  duration: {position: 'absolute', right: 4, bottom: 4, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.75)'},
  durationText: {color: '#fff', fontSize: 10, fontFamily: fonts.medium},
  info: {flex: 1, justifyContent: 'center', gap: 3},
  title: {color: colors.filament, fontFamily: fonts.black, fontSize: 14},
  meta: {color: colors.mist, fontFamily: fonts.medium, fontSize: 12},
  now: {color: colors.neon, fontFamily: fonts.black, fontSize: 11},
});
