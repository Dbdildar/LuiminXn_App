import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {colors, fontSizes, fonts} from '../../../theme';
import {SPLASH, WORDMARK} from '../splashConfig';
import {NeonX} from './NeonX';

type Props = {reduceMotion: boolean};

type LetterProps = {
  char: string;
  delay: number;
  reduceMotion: boolean;
};

function Letter({char, delay, reduceMotion}: LetterProps) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      delay,
      duration: SPLASH.letters.duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();

    return () => animation.stop();
  }, [reduceMotion, delay, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SPLASH.letters.rise, 0],
  });

  return (
    <Animated.Text
      style={[styles.letter, {opacity: progress, transform: [{translateY}]}]}>
      {char}
    </Animated.Text>
  );
}

/**
 * "LuminXn" - thin warm-white letters rising in one by one, with the neon
 * X (see NeonX) igniting between "Lumin" and the final "n".
 */
export function Wordmark({reduceMotion}: Props) {
  const {start, stagger} = SPLASH.letters;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel={WORDMARK.label}
      testID="splash-logo">
      {WORDMARK.before.map((char, index) => (
        <Letter
          key={`before-${index}`}
          char={char}
          delay={start + index * stagger}
          reduceMotion={reduceMotion}
        />
      ))}

      <NeonX reduceMotion={reduceMotion} />

      {WORDMARK.after.map((char, index) => (
        <Letter
          key={`after-${index}`}
          char={char}
          delay={SPLASH.neonX.finalLetterDelay + index * stagger}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: colors.filament,
    fontFamily: fonts.light,
    fontSize: fontSizes.wordmark,
    fontWeight: '300',
    includeFontPadding: false,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 241, 224, 0.35)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 8,
  },
});
