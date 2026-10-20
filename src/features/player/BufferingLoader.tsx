import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';
import {PLAYER} from './playerConfig';

type Props = {
  label?: string;
  testID?: string;
};

/**
 * Glass badge with a spinning arc and a softly pulsing glow.
 * Used for: first load, buffering and waiting after a seek.
 */
export function BufferingLoader({label, testID = 'player-buffering'}: Props) {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true}),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true}),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse]);

  const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});
  const glowScale = pulse.interpolate({inputRange: [0, 1], outputRange: [1, 1.35]});
  const glowOpacity = pulse.interpolate({inputRange: [0, 1], outputRange: [0.35, 0.08]});

  return (
    <View
      testID={testID}
      pointerEvents="none"
      style={styles.fill}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      accessibilityLiveRegion="polite">
      <View style={styles.badge}>
        <Animated.View style={[styles.glow, {opacity: glowOpacity, transform: [{scale: glowScale}]}]} />
        <View style={styles.track} />
        <Animated.View style={[styles.arc, {transform: [{rotate}]}]} />
        <View style={styles.dot} />
      </View>
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

// -------------------------------------------------------------
// 1. REDUCE SIZE HERE (e.g., 36, 38, or 40 instead of 56)
// -------------------------------------------------------------
const SIZE = 38;

// -------------------------------------------------------------
// 2. CHANGE COLORS HERE
// -------------------------------------------------------------
const ACCENT_COLOR = '#457b92'; // Change to your brand color (e.g. '#007AFF', '#10B981', etc.)

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.35)', // Screen overlay background
  },
  badge: {
    width: SIZE + 16,
    height: SIZE + 16,
    borderRadius: (SIZE + 16) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,15,15,0.7)', // Center dark badge background
  },
  glow: {
    position: 'absolute',
    width: SIZE + 16,
    height: SIZE + 16,
    borderRadius: (SIZE + 16) / 2,
    backgroundColor: ACCENT_COLOR, // Outer pulsing glow color
  },
  track: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3, // Thinner border for smaller size
    borderColor: 'rgba(255,255,255,0.18)', // Unfilled ring track color
  },
  arc: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 3, // Match track borderWidth
    borderColor: 'transparent',
    borderTopColor: ACCENT_COLOR, // Spinning active arc color
    borderRightColor: ACCENT_COLOR,
  },
  dot: {
    width: 6, // Smaller dot size
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff', // Center dot color
  },
  label: {
    color: '#ffffff', // Label text color
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});