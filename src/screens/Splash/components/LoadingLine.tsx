import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {colors} from '../../../theme';
import {SPLASH} from '../splashConfig';

type Props = {
  reduceMotion: boolean;
  /** Time in ms the line takes to fill, starting after the configured delay. */
  duration: number;
};

const {width, height, delay} = SPLASH.loadingLine;

/** A thin amber-to-neon line that fills left to right while the app starts. */
export function LoadingLine({reduceMotion, duration}: Props) {
  const translateX = useRef(
    new Animated.Value(reduceMotion ? 0 : -width),
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const animation = Animated.timing(translateX, {
      toValue: 0,
      delay,
      duration: Math.max(duration, 0),
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [reduceMotion, duration, translateX]);

  return (
    <View
      style={styles.track}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      testID="splash-loading">
      <Animated.View style={{width, height, transform: [{translateX}]}}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="loadingGradient" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.amber} stopOpacity="1" />
              <Stop offset="1" stopColor={colors.neon} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width={width}
            height={height}
            fill="url(#loadingGradient)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width,
    height,
    borderRadius: height / 2,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
});
