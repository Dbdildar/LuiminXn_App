import {StyleSheet, View} from 'react-native';
import Svg, {Defs, RadialGradient, Rect, Stop} from 'react-native-svg';
import {colors} from '../../../theme';

/** Static dark-room backdrop: a violet glow fading to ink at the edges. */
export function Backdrop() {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      testID="splash-backdrop">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="vignette" cx="50%" cy="46%" r="75%">
            <Stop offset="0%" stopColor={colors.dusk} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.ink} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#vignette)" />
      </Svg>
    </View>
  );
}
