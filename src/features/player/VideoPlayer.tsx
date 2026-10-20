import {memo, useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Video, {
  type OnBufferData,
  type OnLoadData,
  type OnProgressData,
  type VideoRef,
} from 'react-native-video';
import type {VideoItem} from '../videos';
import {BufferingLoader} from './BufferingLoader';
import {PlayerControls} from './PlayerControls';
import {PlayerError} from './PlayerError';
import {PLAYER, clamp, zoneFromX} from './playerConfig';
import {Icon} from './Icon';
import {useIsOffline} from './useIsOffline';
import {useViewQualifier} from './useViewQualifier';

type Props = {
  video: VideoItem;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  /** Fires once after 5s of real playback. */
  onViewQualified?: (video: VideoItem) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
  /** Pauses playback from outside (e.g. while the search box is open). */
  suspended?: boolean;
  style?: StyleProp<ViewStyle>;
};

const BUFFER = {
  minBufferMs: 1500,
  maxBufferMs: 30000,
  bufferForPlaybackMs: 500,
  bufferForPlaybackAfterRebufferMs: 1500,
};

/**
 * Netflix-style player.
 *  - tap: show/hide controls (auto-hide while playing)
 *  - double tap left/right: -10s / +10s (keep tapping to chain)
 *  - press & hold anywhere: 3x speed, release: back to normal
 *  - scrub bar, ±10s buttons, mute, speed menu, fullscreen, replay at the end
 *  Mount it with key={video.id} so each video starts clean.
 */
export const VideoPlayer = memo(function VideoPlayer({
  video,
  isFullscreen,
  onToggleFullscreen,
  onViewQualified,
  onEnded,
  autoPlay = true,
  suspended = false,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<VideoRef>(null);

  const [size, setSize] = useState({width: 0, height: 0});
  const [paused, setPaused] = useState(!autoPlay);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [ended, setEnded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [stalled, setStalled] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bufferedRatio, setBufferedRatio] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [holding, setHolding] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [activity, setActivity] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [flash, setFlash] = useState<{zone: 'left' | 'right'; total: number} | null>(null);

  const progress = useRef(new Animated.Value(0)).current;
  const durationRef = useRef(0);
  const timeRef = useRef(0);
  const endedRef = useRef(false);
  const holdingRef = useRef(false);
  const scrubbingRef = useRef(false);
  const tapRef = useRef<{zone: string; time: number} | null>(null);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeAtRef = useRef(0);
  const seekTargetRef = useRef<number | null>(null);
  const wasBlocked = useRef(false);

  const {tick, markSeek} = useViewQualifier(video.id, () => onViewQualified?.(video));

  const playing = !paused && !suspended && !ended;
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const rate = holding ? PLAYER.holdRate : speed;
  const offline = useIsOffline();
  // loader: before the first frame, while buffering, and after a seek until playback is ready
  const loading = !hasError && !ended && (!ready || buffering || seeking);
  const networkBlocked = offline && (loading || hasError);
  const showLoader = loading && !networkBlocked;
  const showControls = controlsVisible || !playing || scrubbing;

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (seekTimer.current) clearTimeout(seekTimer.current);
    },
    [],
  );

  // auto-hide controls while playing
  useEffect(() => {
    if (!controlsVisible || !playing || scrubbing || speedMenuOpen || loading) return undefined;
    const id = setTimeout(() => setControlsVisible(false), PLAYER.controlsHideMs);
    return () => clearTimeout(id);
  }, [controlsVisible, playing, scrubbing, speedMenuOpen, loading, activity]);

  // "Slow connection" hint when the loader has been up for too long
  useEffect(() => {
    if (!showLoader) {
      setStalled(false);
      return undefined;
    }
    const id = setTimeout(() => setStalled(true), PLAYER.stallMs);
    return () => clearTimeout(id);
  }, [showLoader]);

  const wake = useCallback(() => {
    setControlsVisible(true);
    setActivity(a => a + 1);
  }, []);

  const setProgressRatio = useCallback(
    (ratio: number) => {
      progress.stopAnimation();
      progress.setValue(clamp(ratio, 0, 1));
    },
    [progress],
  );

  // ------------------------------------------------------------------ seeking
  const seekTo = useCallback(
    (t: number) => {
      const d = durationRef.current;
      if (d <= 0) return;
      const target = clamp(t, 0, d);
      videoRef.current?.seek(target);
      timeRef.current = target;
      setCurrentTime(target);
      setProgressRatio(target / d);
      markSeek();
      seekTargetRef.current = target;
      setSeeking(true);
      if (seekTimer.current) clearTimeout(seekTimer.current);
      seekTimer.current = setTimeout(() => setSeeking(false), PLAYER.seekTimeoutMs);
      if (endedRef.current) {
        endedRef.current = false;
        setEnded(false);
        setPaused(false);
      }
    },
    [markSeek, setProgressRatio],
  );

  const seekBy = useCallback(
    (delta: number) => {
      seekTo(timeRef.current + delta);
      wake();
    },
    [seekTo, wake],
  );

  const replay = useCallback(() => {
    endedRef.current = true; // lets seekTo un-end + resume
    seekTo(0);
    setPaused(false);
    wake();
  }, [seekTo, wake]);

  const togglePlay = useCallback(() => {
    if (endedRef.current) {
      replay();
      return;
    }
    setPaused(p => !p);
    wake();
  }, [replay, wake]);

  // ----------------------------------------------------------- video callbacks
  const handleLoad = (d: OnLoadData) => {
    durationRef.current = d.duration;
    setDuration(d.duration);
    setBuffering(false);
    if (resumeAtRef.current > 0) {
      // after a retry / reconnect continue where the viewer was
      videoRef.current?.seek(resumeAtRef.current);
      resumeAtRef.current = 0;
    }
  };

  const clearSeeking = () => {
    seekTargetRef.current = null;
    if (seekTimer.current) clearTimeout(seekTimer.current);
    setSeeking(false);
  };

  const handleProgress = (d: OnProgressData) => {
    if (scrubbingRef.current) return;
    if (d.currentTime > 0) setReady(true);
    const target = seekTargetRef.current;
    if (target !== null && playingRef.current && Math.abs(d.currentTime - target) < 1.5) clearSeeking();
    timeRef.current = d.currentTime;
    setCurrentTime(d.currentTime);
    const dur = durationRef.current;
    if (dur > 0) {
      // glide to the next position over one tick so the bar moves smoothly
      Animated.timing(progress, {
        toValue: clamp(d.currentTime / dur, 0, 1),
        duration: PLAYER.progressIntervalMs,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();
      setBufferedRatio(clamp((d.playableDuration ?? 0) / dur, 0, 1));
    }
    tick(d.currentTime, playingRef.current);
  };

  const handleEnd = () => {
    endedRef.current = true;
    setEnded(true);
    setPaused(true);
    setProgressRatio(1);
    setControlsVisible(true);
    onEnded?.();
  };

  const handleError = () => {
    setHasError(true);
    setBuffering(false);
  };

  const retry = useCallback(() => {
    resumeAtRef.current = timeRef.current;
    seekTargetRef.current = null;
    setSeeking(false);
    setHasError(false);
    setBuffering(true);
    setReady(false);
    setAttempt(a => a + 1);
  }, []);

  // connection came back while we were blocked on the network -> retry by itself
  useEffect(() => {
    if (networkBlocked) wasBlocked.current = true;
  }, [networkBlocked]);
  useEffect(() => {
    if (!offline && wasBlocked.current) {
      wasBlocked.current = false;
      retry();
    }
  }, [offline, retry]);

  // ------------------------------------------------------------------ gestures
  const skipZone = (zone: 'left' | 'right') => {
    seekBy(zone === 'right' ? PLAYER.seekStepSeconds : -PLAYER.seekStepSeconds);
    setFlash(f =>
      f && f.zone === zone
        ? {zone, total: f.total + PLAYER.seekStepSeconds}
        : {zone, total: PLAYER.seekStepSeconds},
    );
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 700);
  };

  const handleSurfacePress = (e: GestureResponderEvent) => {
    const zone = zoneFromX(e.nativeEvent.locationX, size.width);
    const now = Date.now();
    const last = tapRef.current;
    if (tapTimer.current) clearTimeout(tapTimer.current);

    if (zone !== 'center' && last && last.zone === zone && now - last.time < PLAYER.doubleTapMs) {
      tapRef.current = {zone, time: now}; // allows chained taps
      skipZone(zone);
      return;
    }
    tapRef.current = {zone, time: now};
    tapTimer.current = setTimeout(() => {
      tapRef.current = null;
      setSpeedMenuOpen(false);
      setControlsVisible(v => !v);
      setActivity(a => a + 1);
    }, PLAYER.doubleTapMs);
  };

  const handleLongPress = () => {
    if (!playingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
  };

  const handlePressOut = () => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    setHolding(false);
  };

  // -------------------------------------------------------------------- scrub
  const handleScrubStart = () => {
    scrubbingRef.current = true;
    setScrubbing(true);
    setSpeedMenuOpen(false);
  };
  const handleScrub = (ratio: number) => {
    setProgressRatio(ratio);
    setCurrentTime(ratio * durationRef.current);
  };
  const handleScrubEnd = (ratio: number) => {
    scrubbingRef.current = false;
    setScrubbing(false);
    seekTo(ratio * durationRef.current);
    wake();
  };

  return (
    <View
      testID="video-player"
      style={[styles.container, style]}
      onLayout={e => setSize(e.nativeEvent.layout)}>
      <StatusBar hidden={isFullscreen} />

      <Video
        key={attempt}
        ref={videoRef}
        source={{uri: video.videoUrl}}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        paused={paused || suspended}
        muted={muted}
        rate={rate}
        progressUpdateInterval={PLAYER.progressIntervalMs}
        playInBackground={false}
        playWhenInactive={false}
        bufferConfig={BUFFER}
        onLoad={handleLoad}
        onReadyForDisplay={() => {
          setReady(true);
          setBuffering(false);
        }}
        onBuffer={(d: OnBufferData) => setBuffering(d.isBuffering)}
        onSeek={clearSeeking}
        onProgress={handleProgress}
        onEnd={handleEnd}
        onError={handleError}
      />

      {!ready && !hasError && (
        <Image source={{uri: video.poster}} style={StyleSheet.absoluteFill} resizeMode="cover" />
      )}

      <Pressable
        testID="player-surface"
        style={StyleSheet.absoluteFill}
        accessible={false}
        delayLongPress={PLAYER.holdMs}
        onPress={handleSurfacePress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
      />

      {showLoader && (
        <BufferingLoader
          label={stalled ? 'Slow connection…' : !ready || seeking ? 'Loading…' : 'Buffering…'}
        />
      )}

      {holding && (
        <View pointerEvents="none" style={styles.holdPill} testID="player-hold-pill">
          <Text style={styles.holdText}>{PLAYER.holdRate}2X</Text>
        </View>
      )}

      {flash && (
        <View
          pointerEvents="none"
          testID={`player-skip-${flash.zone}`}
          style={[styles.flash, flash.zone === 'left' ? {left: 0} : {right: 0}]}>
          <Icon name={flash.zone === 'left' ? 'rotate-ccw' : 'rotate-cw'} size={28} />
          <Text style={styles.flashText}>{flash.total} seconds</Text>
        </View>
      )}

      {showControls && !hasError && !networkBlocked && (
        <PlayerControls
          title={video.title}
          width={size.width}
          insets={insets}
          playing={playing}
          ended={ended}
          loading={showLoader}
          muted={muted}
          speed={speed}
          speedMenuOpen={speedMenuOpen}
          isFullscreen={isFullscreen}
          duration={duration}
          currentTime={currentTime}
          buffered={bufferedRatio}
          progress={progress}
          onTogglePlay={togglePlay}
          onReplay={replay}
          onSeekBy={seekBy}
          onToggleMute={() => {
            setMuted(m => !m);
            wake();
          }}
          onToggleSpeedMenu={() => {
            setSpeedMenuOpen(o => !o);
            wake();
          }}
          onSelectSpeed={s => {
            setSpeed(s);
            setSpeedMenuOpen(false);
            wake();
          }}
          onToggleFullscreen={() => {
            onToggleFullscreen();
            wake();
          }}
          onScrubStart={handleScrubStart}
          onScrub={handleScrub}
          onScrubEnd={handleScrubEnd}
        />
      )}

      {(hasError || networkBlocked) && (
        <PlayerError variant={networkBlocked ? 'network' : 'playback'} onRetry={retry} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {backgroundColor: '#000', overflow: 'hidden'},
  centerFill: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
  holdPill: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  holdText: {color: '#fff', fontSize: 12, fontWeight: '800'},
  flash: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  flashText: {color: '#fff', fontSize: 12, fontWeight: '800'},
});

export default VideoPlayer;
