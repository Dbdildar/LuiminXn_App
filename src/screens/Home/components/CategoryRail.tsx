import {memo, useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Shimmer} from '../../../components/ui/Shimmer';
import {colors, fonts} from '../../../theme';
import {glass} from '../../../theme/glass';
import {HOME} from '../homeConfig';

type Props = {
  categories: string[];
  active: string;
  loading: boolean;
  onSelect: (category: string) => void;
};

/** Deals items alternately into `rows` rows: [a,b,c,d,e] -> [[a,c,e],[b,d]]. */
export function splitRows(items: string[], rows: number): string[][] {
  const out: string[][] = Array.from({length: rows}, () => []);
  items.forEach((item, i) => out[i % rows].push(item));
  return out;
}

const Pill = memo(function Pill({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: (c: string) => void;
}) {
  return (
    <Pressable
      testID={`category-${label}`}
      onPress={() => onSelect(label)}
      accessibilityRole="button"
      accessibilityLabel={`Filter by ${label} category`}
      accessibilityState={{selected}}
      style={({pressed}) => [
        styles.pill,
        selected ? styles.pillSelected : styles.pillIdle,
        pressed && styles.pressed,
      ]}>
      <Text
        style={[styles.label, selected && styles.labelSelected]}
        maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
  );
});

/**
 * Two stacked rows of category chips inside ONE horizontal ScrollView,
 * so both rows scroll together. "All" is first and selected by default.
 */
export function CategoryRail({categories, active, loading, onSelect}: Props) {
 const rows = useMemo(
  () => splitRows(['All', ...categories], 2), // Hardcode 2 here
  [categories],
);

  const skeletonPerRow = Math.ceil(HOME.skeleton.categories / HOME.categories.rows);

  return (
    <View testID="category-rail">
      <ScrollView
        testID="category-scroll"
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}>
        <View style={styles.rows}>
          {rows.map((row, r) => (
            <View key={r} testID={`category-row-${r}`} style={styles.row}>
              {row.map(label => (
                <Pill key={label} label={label} selected={label === active} onSelect={onSelect} />
              ))}
              {loading &&
                Array.from({length: skeletonPerRow}).map((_, i) => (
                  <Shimmer key={`s${i}`} style={[styles.pill, {width: 64 + ((i + r) % 3) * 18}]} />
                ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {paddingHorizontal: HOME.grid.padding, paddingVertical: 6},
  rows: {gap: 10},
  row: {flexDirection: 'row', gap: 8},
  pill: {
    minHeight: 38,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 3, // fake 3D edge
    borderBottomColor: 'rgba(0,0,0,0.4)',
  },
  pillIdle: {borderColor: glass.border, backgroundColor: glass.surface},
  pillSelected: {
    borderColor: colors.neon,
    backgroundColor: colors.neon,
    shadowColor: colors.neon,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  label: {color: colors.filament, fontFamily: fonts.medium, fontSize: 13, opacity: 0.85},
  labelSelected: {opacity: 1, fontFamily: fonts.black, color: colors.ink},
  pressed: {opacity: 0.75, transform: [{translateY: 1}]},
});

export default CategoryRail;
