import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {Icon} from '../../../features/player/Icon';
import {colors, fonts} from '../../../theme';

type Props = {
  searchOpen: boolean;
  query: string;
  topInset: number;
  onBack: () => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onChangeQuery: (q: string) => void;
};

/** Back on the left, a single search icon on the right. Tapping it turns the bar into a search field. */
export function DetailHeader({searchOpen, query, topInset, onBack, onOpenSearch, onCloseSearch, onChangeQuery}: Props) {
  return (
    <View style={[styles.bar, {paddingTop: topInset + 1 }]} testID="video-detail-header">
      <Pressable
        testID="video-detail-back"
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={onBack}
        hitSlop={8}
        style={styles.btn}>
        <Icon name="arrow-left" size={24} />
      </Pressable>

      {searchOpen ? (
        <>
          <TextInput
            testID="video-detail-search-input"
            style={styles.input}
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search videos"
            placeholderTextColor={colors.mist}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            maxFontSizeMultiplier={1.3}
          />
          <Pressable
            testID="video-detail-search-close"
            accessibilityRole="button"
            accessibilityLabel="Close search"
            onPress={onCloseSearch}
            hitSlop={8}
            style={styles.btn}>
            <Icon name="x" size={22} />
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.spacer} />
          <Pressable
            testID="video-detail-search"
            accessibilityRole="button"
            accessibilityLabel="Search"
            onPress={onOpenSearch}
            hitSlop={8}
            style={styles.btn}>
            <Icon name="search" size={22} />
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {flexDirection: 'row', alignItems: 'center', gap: 1, paddingHorizontal: 8, paddingBottom: 0, backgroundColor: colors.ink},
  btn: {width: 44, height: 44, alignItems: 'center', justifyContent: 'center'},
  spacer: {flex: 1},
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    color: colors.filament,
    fontFamily: fonts.medium,
    fontSize: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
