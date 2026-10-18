import {FlatList, StyleSheet, View, useWindowDimensions} from 'react-native';
import {Shimmer} from '../../../components/ui/Shimmer';
import type {VideoItem} from '../../../features/videos';
import {HOME, getCardWidth} from '../homeConfig';
import {VideoCard} from './VideoCard';

type Props = {
  videos: VideoItem[];
  loading: boolean;
  onOpenVideo: (video: VideoItem) => void;
};

/** Horizontal trending row. Cards are sized so 3 are always visible per screen. */
export function TrendingRail({videos, loading, onOpenVideo}: Props) {
  const {width} = useWindowDimensions();
  const cardWidth = getCardWidth(width);
  const step = cardWidth + HOME.grid.gap;

  if (loading) {
    return (
      <View style={styles.content} testID="trending-skeleton">
        {Array.from({length: HOME.trending.minVisible}).map((_, i) => (
          <Shimmer
            key={i}
            style={{width: cardWidth, height: Math.round(cardWidth * 1.5), borderRadius: 16}}
          />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      testID="trending-rail"
      horizontal
      data={videos}
      keyExtractor={v => v.id}
      showsHorizontalScrollIndicator={false}
      snapToInterval={step}
      decelerationRate="fast"
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{width: HOME.grid.gap}} />}
      // trending cards are tall; give the row vertical room for the 3D lift + shadow
      style={styles.list}
      renderItem={({item, index}) => (
        <VideoCard video={item} width={cardWidth} onOpen={onOpenVideo} rank={index + 1} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {overflow: 'visible'},
  listContent: {paddingHorizontal: HOME.grid.padding, paddingVertical: 10},
  content: {
    flexDirection: 'row',
    gap: HOME.grid.gap,
    paddingHorizontal: HOME.grid.padding,
    paddingVertical: 10,
  },
});

export default TrendingRail;
