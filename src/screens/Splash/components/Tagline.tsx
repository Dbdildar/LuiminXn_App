import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet} from 'react-native';
import {colors, fontSizes, fonts} from '../../../theme';
import {SPLASH} from '../splashConfig';

type Props = {reduceMotion: boolean};

export function Tagline({reduceMotion}: Props) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      delay: SPLASH.tagline.delay,
      duration: SPLASH.tagline.duration,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [reduceMotion, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  return (
    <Animated.Text
      testID="splash-tagline"
      style={[styles.text, {opacity: progress, transform: [{translateY}]}]}>
      {SPLASH.tagline.text}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    marginTop: 18,
    color: colors.mist,
    fontFamily: fonts.light,
    fontSize: fontSizes.tagline,
    letterSpacing: 1.5,
  },
});
