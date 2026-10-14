import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet} from 'react-native';
import Svg, {Defs, LinearGradient, Polygon, Stop} from 'react-native-svg';
import {colors} from '../../../theme';
import {SPLASH} from '../splashConfig';

type Props = {reduceMotion: boolean};

/** A warm projector beam that fades in from the top, then gently breathes. */
export function ProjectorBeam({reduceMotion}: Props) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 0.8 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const fadeIn = Animated.timing(opacity, {
      toValue: 1,
      delay: SPLASH.beam.delay,
      duration: SPLASH.beam.duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.78,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const sequence = Animated.sequence([fadeIn, breathe]);
    sequence.start();

    return () => sequence.stop();
  }, [reduceMotion, opacity]);

  return (
    <Animated.View
      pointerEvents="none"
      testID="splash-beam"
      style={[styles.beam, {opacity}]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="beamGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.amber} stopOpacity="0.5" />
            <Stop offset="0.55" stopColor={colors.amber} stopOpacity="0.12" />
            <Stop offset="1" stopColor={colors.amber} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Polygon points="46,0 54,0 98,100 2,100" fill="url(#beamGradient)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  beam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '72%',
  },
});
