import {memo} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {Shimmer} from '../../../components/ui/Shimmer';
import {colors, fonts} from '../../../theme';
import {glass} from '../../../theme/glass';
import {HOME} from '../oldhomeConfig';

type Props = {
  categories: string[];
  active: string;
  loading: boolean;
  onSelect: (category: string) => void;
};

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
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
});

/** Horizontal category chips. "All" is always first and selected by default. */
export function CategoryRail({categories, active, loading, onSelect}: Props) {
  const data = ['All', ...categories];
  return (
    <View testID="category-rail">
      <FlatList
        horizontal
        data={data}
        extraData={active}
        keyExtractor={c => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        renderItem={({item}) => (
          <Pill label={item} selected={item === active} onSelect={onSelect} />
        )}
        ListFooterComponent={
          loading ? (
            <View style={styles.skeletons}>
              {Array.from({length: HOME.skeleton.categories}).map((_, i) => (
                <Shimmer key={i} style={[styles.pill, {width: 64 + (i % 3) * 18}]} />
              ))}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {paddingHorizontal: HOME.grid.padding, paddingVertical: 4, gap: 8},
  skeletons: {flexDirection: 'row', gap: 8},
  pill: {
    minHeight: 38,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
  },
  pillIdle: {borderColor: glass.border, backgroundColor: glass.surface},
  pillSelected: {
    borderColor: colors.neon,
    backgroundColor: colors.neon,
    shadowColor: colors.neon,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  label: {color: colors.filament, fontFamily: fonts.medium, fontSize: 13, opacity: 0.85},
  labelSelected: {opacity: 1, fontFamily: fonts.black},
  pressed: {opacity: 0.75},
});
