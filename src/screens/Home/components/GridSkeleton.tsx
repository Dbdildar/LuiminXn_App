import {StyleSheet, View} from 'react-native';
import {Shimmer} from '../../../components/ui/Shimmer';
import {HOME} from '../homeConfig';

type Props = {columns: number; cardWidth: number};

export function GridSkeleton({columns, cardWidth}: Props) {
  const height = Math.round(cardWidth * HOME.grid.cardAspect);
  const count = Math.max(HOME.skeleton.grid, columns * 2);
  return (
    <View style={styles.grid} testID="grid-skeleton">
      {Array.from({length: count}).map((_, i) => (
        <Shimmer key={i} style={{width: cardWidth, height, borderRadius: 18}} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: HOME.grid.gap,
    paddingHorizontal: HOME.grid.padding,
  },
});
