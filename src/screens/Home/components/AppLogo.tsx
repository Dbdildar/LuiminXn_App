import {StyleSheet, Text, View, useWindowDimensions} from 'react-native';
import Svg, {Defs, LinearGradient, Polygon, Rect, Stop, Text as SvgText} from 'react-native-svg';
import {Icon} from '../../../components/icons';
import {colors, fonts} from '../../../theme';
import {brand} from '../../../theme/glass';

/** Gradient "play" badge + "LuminXn" wordmark + tagline (from the reference header). */
export function AppLogo() {
  const {width} = useWindowDimensions();
  const showTagline = width >= 340;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel="LuminXn. Explore the hype"
      testID="home-logo">
      <View style={styles.badgeWrap}>
        <View style={styles.ring} />
        <Svg width={44} height={44} viewBox="0 0 44 44">
          <Defs>
            <LinearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={brand.fuchsia} />
              <Stop offset="0.5" stopColor={brand.violet} />
              <Stop offset="1" stopColor={brand.cyan} />
            </LinearGradient>
          </Defs>
          <Rect width="44" height="44" rx="14" fill="url(#logoBg)" />
          <Rect x="6" y="6" width="32" height="32" rx="10" fill="#fff" fillOpacity={0.25} />
          <Polygon points="18,14 31,22 18,30" fill="#fff" />
        </Svg>
        <View style={styles.zap}>
          <Icon name="zap" size={12} color={brand.cyanSoft} />
        </View>
      </View>

      <View style={styles.textCol}>
        <View style={styles.wordmark} importantForAccessibility="no-hide-descendants">
          <Text style={styles.word}>Lumin</Text>
          <Svg width={17} height={26}>
            <Defs>
              <LinearGradient id="xGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={brand.fuchsia} />
                <Stop offset="1" stopColor={brand.cyanLight} />
              </LinearGradient>
            </Defs>
            <SvgText
              x="8.5"
              y="21"
              fontSize="20"
              fontFamily={fonts.black}
              fontWeight="900"
              textAnchor="middle"
              fill="url(#xGrad)">
              X
            </SvgText>
          </Svg>
          <Text style={styles.word}>n</Text>
        </View>
        {showTagline && <Text style={styles.tagline}>Explore The Hype</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center'},
  badgeWrap: {
    width: 44,
    height: 44,
    shadowColor: brand.violet,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  zap: {position: 'absolute', top: -5, right: -5},
  textCol: {marginLeft: 14, justifyContent: 'center'},
  wordmark: {flexDirection: 'row', alignItems: 'center', height: 26},
  word: {
    color: colors.filament,
    fontFamily: fonts.black,
    fontSize: 20,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  tagline: {
    marginTop: 1,
    color: colors.mist,
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
});
