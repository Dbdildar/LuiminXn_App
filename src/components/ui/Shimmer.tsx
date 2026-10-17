import {useEffect, useRef, useState} from 'react';
import {Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';
import {useReducedMotion} from '../../hooks';
import {glass} from '../../theme/glass';

type Props = {style?: StyleProp<ViewStyle>};

/** Loading placeholder with a light sweep. Static when "reduce motion" is on. */
export function Shimmer({style}: Props) {
  const reduceMotion = !!useReducedMotion();
  const [width, setWidth] = useState(0);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion || width === 0) {
      return undefined;
    }
    const loop = Animated.loop(
      Animated.timing(sweep, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, width, sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      testID="shimmer"
      style={[styles.base, style]}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {width > 0 && !reduceMotion && (
        <Animated.View style={[styles.sweep, {width, transform: [{translateX}]}]}>
          <Svg width={width} height="100%">
            <Defs>
              <LinearGradient id="shimmerSweep" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#fff" stopOpacity="0" />
                <Stop offset="0.5" stopColor="#fff" stopOpacity="0.14" />
                <Stop offset="1" stopColor="#fff" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#shimmerSweep)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.border,
    backgroundColor: glass.surface,
  },
  sweep: {...StyleSheet.absoluteFillObject},
});
