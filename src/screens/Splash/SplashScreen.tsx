import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useReducedMotion} from '../../hooks';
import {colors} from '../../theme';
import {
  Backdrop,
  DustMotes,
  LoadingLine,
  Tagline,
  Wordmark,
} from './components';
import {SPLASH} from './splashConfig';

export type SplashScreenProps = {
  /** Called once, when the splash has finished and faded out. */
  onFinish: () => void;
  /** Total time in ms before `onFinish` is called. Defaults to 3.8 seconds. */
  duration?: number;
};


export function SplashScreen({
  onFinish,
  duration = SPLASH.totalDuration,
}: SplashScreenProps) {
  const reduceMotion = useReducedMotion();
  const fade = useRef(new Animated.Value(1)).current;
  const finished = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  const total = reduceMotion ? SPLASH.reducedMotionDuration : duration;
  const fadeDuration = Math.min(SPLASH.fadeOutDuration, total / 3);

  useEffect(() => {
    if (reduceMotion === null) {
      return undefined;
    }

    const fadeOut = Animated.timing(fade, {
      toValue: 0,
      delay: total - fadeDuration,
      duration: fadeDuration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    });
    fadeOut.start();

  
    const timer = setTimeout(() => {
      if (!finished.current) {
        finished.current = true;
        onFinishRef.current();
      }
    }, total);

    return () => {
      clearTimeout(timer);
      fadeOut.stop();
    };
  }, [reduceMotion, total, fadeDuration, fade]);

  return (
    <View style={styles.root} testID="splash-screen">
      <Backdrop />

      {reduceMotion !== null && (
        <Animated.View style={[styles.scene, {opacity: fade}]}>
          <DustMotes reduceMotion={reduceMotion} />

          <View style={styles.center}>
            <Wordmark reduceMotion={reduceMotion} />
            <Tagline reduceMotion={reduceMotion} />
          </View>

          <View style={styles.footer}>
            <LoadingLine
              reduceMotion={reduceMotion}
              duration={total - fadeDuration - SPLASH.loadingLine.delay}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scene: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '12%',
    alignItems: 'center',
  },
});

export default SplashScreen;
