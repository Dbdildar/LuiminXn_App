import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {useReducedMotion} from '../../../hooks';
import {glass} from '../../../theme/glass';

function Dot({index, animate}: {index: number; animate: boolean}) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animate) {
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(index * 140),
        Animated.timing(y, {toValue: -5, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true}),
        Animated.timing(y, {toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true}),
        Animated.delay(280),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, index, y]);
  return <Animated.View style={[styles.dot, {transform: [{translateY: y}]}]} />;
}

/** Three glass dots shown over the poster while the preview clip buffers. */
export function PreviewLoader() {
  const reduce = !!useReducedMotion();
  return (
    <View style={styles.center} pointerEvents="none" testID="preview-loader">
      <View style={styles.pill}>
        {[0, 1, 2].map(i => (
          <Dot key={i} index={i} animate={!reduce} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center'},
  pill: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dot: {width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff'},
});
