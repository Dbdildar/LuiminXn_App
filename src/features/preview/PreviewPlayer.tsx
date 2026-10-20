import {StyleSheet} from 'react-native';
import Video from 'react-native-video';
import type {VideoItem} from '../../videos';

type Props = {
  video: VideoItem;
  /** Fires when the first frame is visible (hides the loader). */
  onReady?: () => void;
  onError?: () => void;
};

// Small buffers so playback starts as soon as possible.
const BUFFER = {
  minBufferMs: 250,
  maxBufferMs: 2000,
  bufferForPlaybackMs: 250,
  bufferForPlaybackAfterRebufferMs: 500,
};

/** Muted, looping preview clip drawn over the card's poster. */
export function PreviewPlayer({video, onReady, onError}: Props) {
  if (!video.videoUrl) {
    return null;
  }
  return (
    <Video
      testID="preview-video"
      source={{uri: video.videoUrl}}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
      muted
      repeat
      paused={false}
      disableFocus
      playInBackground={false}
      bufferConfig={BUFFER}
      onReadyForDisplay={onReady}
      onError={onError}
    />
  );
}

export default PreviewPlayer;
