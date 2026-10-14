import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {Circle, Defs, RadialGradient, Stop} from 'react-native-svg';
import {colors, fontSizes, fonts} from '../../../theme';
import {SPLASH, WORDMARK} from '../splashConfig';

type Props = {reduceMotion: boolean};

/** [target opacity, duration in ms] steps of the neon tube "striking" flicker. */
const FLICKER_STEPS: ReadonlyArray<readonly [number, number]> = [
  [1, 70],
  [0.1, 50],
  [1, 60],
  [0.25, 50],
  [1, 90],
  [0.6, 40],
];

/** Quick left/right/rotate jitter values for one shiver burst. */
const SHIVER_STEPS: readonly number[] = [1, -1, 0.7, -0.7, 0.4, 0];

const HALO = SPLASH.neonX.haloSize;

/**
 * The bold "X" of LuminXn: a neon tube that ignites with a flicker, then
 * keeps shivering and blinking, with a soft pulsing glow behind it.
 */
export function NeonX({reduceMotion}: Props) {
  const ignite = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const shiver = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const {igniteDelay, igniteDuration, shiverPause, blinkPause} = SPLASH.neonX;

    // 1. Ignition: the tube strikes with a flicker, then settles on full power.
    const flickerTime = FLICKER_STEPS.reduce((sum, [, ms]) => sum + ms, 0);
    const ignition = Animated.sequence([
      Animated.delay(igniteDelay),
      ...FLICKER_STEPS.map(([toValue, duration]) =>
        Animated.timing(ignite, {toValue, duration, useNativeDriver: true}),
      ),
      Animated.timing(ignite, {
        toValue: 1,
        duration: Math.max(igniteDuration - flickerTime, 0),
        useNativeDriver: true,
      }),
    ]);

    // 2. Blink: short power dips, repeated forever.
    const blinkLoop = Animated.sequence([
      Animated.delay(igniteDelay + igniteDuration),
      Animated.loop(
        Animated.sequence([
          Animated.delay(blinkPause),
          Animated.timing(blink, {
            toValue: 0.15,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 60,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 0.3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 90,
            useNativeDriver: true,
          }),
        ]),
      ),
    ]);

    // 3. Shiver: tiny fast jitters in bursts, repeated forever.
    const shiverLoop = Animated.sequence([
      Animated.delay(igniteDelay + igniteDuration + 300),
      Animated.loop(
        Animated.sequence([
          ...SHIVER_STEPS.map(toValue =>
            Animated.timing(shiver, {
              toValue,
              duration: 45,
              useNativeDriver: true,
            }),
          ),
          Animated.delay(shiverPause),
        ]),
      ),
    ]);

    // 4. Glow: slow breathing halo behind the letter.
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0.6,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const all = Animated.parallel([ignition, blinkLoop, shiverLoop, glowLoop]);
    all.start();

    return () => all.stop();
  }, [reduceMotion, ignite, blink, shiver, glow]);

  const letterOpacity = Animated.multiply(ignite, blink);
  const haloOpacity = Animated.multiply(letterOpacity, glow);
  const haloScale = glow.interpolate({
    inputRange: [0.6, 1],
    outputRange: [0.92, 1.08],
  });
  const translateX = shiver.interpolate({
    inputRange: [-1, 1],
    outputRange: [-2.5, 2.5],
  });
  const rotate = shiver.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  return (
    <View style={styles.wrap} testID="splash-logo-x">
      <Animated.View
        pointerEvents="none"
        style={[
          styles.halo,
          {opacity: haloOpacity, transform: [{scale: haloScale}]},
        ]}>
        <Svg width={HALO} height={HALO}>
          <Defs>
            <RadialGradient id="neonHalo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.neon} stopOpacity="0.55" />
              <Stop offset="100%" stopColor={colors.neon} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={HALO / 2}
            cy={HALO / 2}
            r={HALO / 2}
            fill="url(#neonHalo)"
          />
        </Svg>
      </Animated.View>

      <Animated.Text
        style={[
          styles.x,
          {opacity: letterOpacity, transform: [{translateX}, {rotate}]},
        ]}>
        {WORDMARK.accent}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO,
    height: HALO,
  },
  x: {
    color: colors.neon,
    fontFamily: fonts.black,
    fontSize: fontSizes.wordmark,
    fontWeight: '900',
    includeFontPadding: false,
    textShadowColor: colors.neon,
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 18,
  },
});
