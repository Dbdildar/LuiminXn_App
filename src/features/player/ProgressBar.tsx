import {useRef, useState} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import {PLAYER, clamp, formatClock} from './playerConfig';

type Props = {
  /** 0..1, animated by the player so it moves smoothly between progress ticks. */
  progress: Animated.Value;
  /** 0..1 */
  buffered: number;
  duration: number;
  onScrubStart: () => void;
  onScrub: (ratio: number) => void;
  onScrubEnd: (ratio: number) => void;
  onStep?: (deltaSeconds: number) => void;
};

/** Netflix-style scrubber: thin red bar, grows + shows a time bubble while dragging. */
export function ProgressBar({progress, buffered, duration, onScrubStart, onScrub, onScrubEnd, onStep}: Props) {
  const [width, setWidth] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const widthRef = useRef(0);
  const startX = useRef(0);
  const startPageX = useRef(0);
  const lastRatio = useRef(0);

  const ratioAt = (x: number) => (widthRef.current > 0 ? clamp(x / widthRef.current, 0, 1) : 0);

  const handleLayout = (e: LayoutChangeEvent) => {
    widthRef.current = e.nativeEvent.layout.width;
    setWidth(e.nativeEvent.layout.width);
  };

  const handleGrant = (e: GestureResponderEvent) => {
    startX.current = e.nativeEvent.locationX;
    startPageX.current = e.nativeEvent.pageX ?? e.nativeEvent.locationX;
    const r = ratioAt(startX.current);
    lastRatio.current = r;
    setScrub(r);
    onScrubStart();
    onScrub(r);
  };

  const handleMove = (e: GestureResponderEvent) => {
    const pageX = e.nativeEvent.pageX ?? startPageX.current;
    const r = ratioAt(startX.current + (pageX - startPageX.current));
    lastRatio.current = r;
    setScrub(r);
    onScrub(r);
  };

  const handleEnd = () => {
    setScrub(null);
    onScrubEnd(lastRatio.current);
  };

  const handleA11y = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'increment') onStep?.(PLAYER.seekStepSeconds);
    if (e.nativeEvent.actionName === 'decrement') onStep?.(-PLAYER.seekStepSeconds);
  };

  const fillWidth = progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%'], extrapolate: 'clamp'});
  const active = scrub !== null;
  const bubbleLeft = clamp((scrub ?? 0) * width - 24, 0, Math.max(width - 48, 0));

  return (
    <View
      testID="player-progress"
      style={styles.hit}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => duration > 0}
      onMoveShouldSetResponder={() => duration > 0}
      onResponderTerminationRequest={() => false}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleEnd}
      onResponderTerminate={handleEnd}
      accessibilityRole="adjustable"
      accessibilityLabel="Seek"
      accessibilityValue={{min: 0, max: Math.round(duration), now: Math.round((scrub ?? 0) * duration)}}
      accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
      onAccessibilityAction={handleA11y}>
      <View pointerEvents="none" style={[styles.track, active && styles.trackActive]}>
        <View style={[styles.layer, {width: `${clamp(buffered, 0, 1) * 100}%`, backgroundColor: 'rgba(255,255,255,0.35)'}]} />
        <Animated.View style={[styles.layer, {width: fillWidth, backgroundColor: PLAYER.accent}]} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.thumbWrap, {left: fillWidth}]}>
        <View style={[styles.thumb, active && styles.thumbActive]} />
      </Animated.View>
      {active && (
        <View pointerEvents="none" style={[styles.bubble, {left: bubbleLeft}]}>
          <Text testID="progress-bubble" style={styles.bubbleText}>
            {formatClock((scrub ?? 0) * duration)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {height: 36, justifyContent: 'center'},
  track: {height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)'},
  trackActive: {height: 8, borderRadius: 4},
  layer: {position: 'absolute', left: 0, top: 0, bottom: 0},
  thumbWrap: {position: 'absolute', top: 0, bottom: 0, justifyContent: 'center'},
  thumb: {width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: PLAYER.accent},
  thumbActive: {transform: [{scale: 1.6}]},
  bubble: {
    position: 'absolute',
    top: -30,
    width: 48,
    alignItems: 'center',
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  bubbleText: {color: '#fff', fontSize: 12, fontWeight: '700'},
});
