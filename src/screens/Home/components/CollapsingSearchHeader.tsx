import {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {Icon} from '../../../components/icons';
import {useReducedMotion} from '../../../hooks';
import {colors, fontSizes, fonts} from '../../../theme';
import {glass} from '../../../theme/glass';
import {HOME} from '../oldhomeConfig';
import {AppLogo} from './AppLogo';

type Props = {
  query: string;
  onChangeQuery: (q: string) => void;
  /** true = full search bar, false = just a search icon in the top-right corner. */
  expanded: boolean;
  onExpand: () => void;
  onSubmit: () => void;
  topInset: number;
};

const {
  logoRowHeight: LOGO,
  searchHeight: SEARCH,
  collapsedSize: SIZE,
  collapsedHeight,
  expandedHeight,
  horizontalPadding: PAD,
  animationMs,
} = HOME.header;

/**
 * Fixed header: the logo never moves. The search bar slides up and shrinks into
 * a round icon at the top-right corner (and grows back) with one animation value.
 */
export function CollapsingSearchHeader({
  query,
  onChangeQuery,
  expanded,
  onExpand,
  onSubmit,
  topInset,
}: Props) {
  const {width} = useWindowDimensions();
  const reduceMotion = !!useReducedMotion();
  const progress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const inputRef = useRef<TextInput>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: expanded ? 1 : 0,
      duration: reduceMotion ? 0 : animationMs,
      easing: Easing.out(Easing.cubic),
      // Width / top / height are layout props, so the JS driver is required.
      useNativeDriver: false,
    });
    animation.start();
    if (!expanded) {
      inputRef.current?.blur();
    }
    return () => animation.stop();
  }, [expanded, reduceMotion, progress]);

  useEffect(
    () => () => {
      if (focusTimer.current) {
        clearTimeout(focusTimer.current);
      }
    },
    [],
  );

  const range = [0, 1];
  const fullWidth = Math.max(width - PAD * 2, SIZE);
  const barWidth = progress.interpolate({inputRange: range, outputRange: [SIZE, fullWidth]});
  const barHeight = progress.interpolate({inputRange: range, outputRange: [SIZE, SEARCH]});
  const barTop = progress.interpolate({
    inputRange: range,
    outputRange: [(LOGO - SIZE) / 2, LOGO + 4],
  });
  const headerHeight = progress.interpolate({
    inputRange: range,
    outputRange: [collapsedHeight + topInset, expandedHeight + topInset],
  });
  const inputOpacity = progress.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });
  const dotOpacity = progress.interpolate({inputRange: range, outputRange: [1, 0]});

  const handleIconPress = () => {
    if (!expanded) {
      onExpand();
      focusTimer.current = setTimeout(
        () => inputRef.current?.focus(),
        reduceMotion ? 0 : 140,
      );
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <Animated.View
      style={[styles.header, {height: headerHeight}]}
      testID="home-header"
      pointerEvents="box-none">
      <View style={[styles.inner, {top: topInset}]} pointerEvents="box-none">
        <View style={styles.logoRow} pointerEvents="none">
          <AppLogo />
        </View>

        <Animated.View style={[styles.bar, {width: barWidth, height: barHeight, top: barTop}]}>
          <Pressable
            testID="home-search-toggle"
            onPress={handleIconPress}
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Search' : 'Open search'}
            accessibilityState={{expanded}}
            style={styles.iconBox}>
            <Icon name="search" size={20} color={colors.filament} />
            {!expanded || query.length > 0 ? (
              <Animated.View
                testID="home-search-active-dot"
                style={[styles.dot, {opacity: query.length > 0 ? dotOpacity : 0}]}
              />
            ) : null}
          </Pressable>

          <Animated.View
            style={[styles.inputWrap, {opacity: inputOpacity}]}
            pointerEvents={expanded ? 'auto' : 'none'}>
            <TextInput
              ref={inputRef}
              testID="home-search-input"
              value={query}
              onChangeText={onChangeQuery}
              onSubmitEditing={onSubmit}
              editable={expanded}
              placeholder="Search by title, category or actor…"
              placeholderTextColor={colors.mist}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              style={styles.input}
              accessibilityLabel="Search videos"
            />
            {query.length > 0 && (
              <Pressable
                testID="home-search-clear"
                onPress={() => onChangeQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={10}
                style={styles.clear}>
                <Icon name="x" size={16} color={colors.mist} />
              </Pressable>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: glass.header,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: glass.border,
    elevation: 6,
  },
  inner: {position: 'absolute', left: 0, right: 0, height: expandedHeight},
  logoRow: {
    height: LOGO,
    justifyContent: 'center',
    paddingHorizontal: PAD,
  },
  bar: {
    position: 'absolute',
    right: PAD,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: glass.borderStrong,
    backgroundColor: glass.surfaceStrong,
  },
  iconBox: {
    width: SIZE,
    height: '100%',
    minHeight: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neon,
  },
  inputWrap: {flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 12},
  input: {
    flex: 1,
    paddingVertical: 0,
    color: colors.filament,
    fontFamily: fonts.medium,
    fontSize: fontSizes.body - 1,
  },
  clear: {marginLeft: 8},
});
