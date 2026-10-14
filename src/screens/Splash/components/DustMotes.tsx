import {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import {colors} from '../../../theme';
import {DUST_MOTES} from '../splashConfig';

type Props = {reduceMotion: boolean};

type MoteProps = {
  mote: (typeof DUST_MOTES)[number];
  reduceMotion: boolean;
};

function Mote({mote, reduceMotion}: MoteProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      return undefined;
    }

    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        delay: mote.delay,
        duration: mote.duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();

    return () => loop.stop();
  }, [mote, reduceMotion, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });
  const opacity = reduceMotion
    ? 0.45
    : progress.interpolate({
        inputRange: [0, 0.2, 0.8, 1],
        outputRange: [0, 0.8, 0.8, 0],
      });

  return (
    <Animated.View
      style={[
        styles.mote,
        {
          left: `${mote.x}%`,
          top: `${mote.y}%`,
          width: mote.size,
          height: mote.size,
          borderRadius: mote.size / 2,
          opacity,
          transform: [{translateY}],
        },
      ]}
    />
  );
}

/** Tiny specks of dust drifting upward through the projector beam. */
export function DustMotes({reduceMotion}: Props) {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      testID="splash-dust">
      {DUST_MOTES.map((mote, index) => (
        <Mote key={index} mote={mote} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mote: {
    position: 'absolute',
    backgroundColor: colors.filament,
  },
});
