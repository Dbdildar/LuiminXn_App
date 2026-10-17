import {FlatList, StyleSheet, View, useWindowDimensions} from 'react-native';
import {Shimmer} from '../../../components/ui/Shimmer';
import type {VideoItem} from '../../../features/videos';
import {HOME, getTrendingCardWidth} from '../homeConfig';
import {VideoCard} from './VideoCard';

type Props = {
  videos: VideoItem[];
  loading: boolean;
  onOpenVideo: (video: VideoItem) => void;
};

/** One horizontally scrolling row of the most-viewed videos, numbered 1..n. */
export function TrendingRail({videos, loading, onOpenVideo}: Props) {
  const {width} = useWindowDimensions();
  const cardWidth = getTrendingCardWidth(width);
  const cardHeight = Math.round(cardWidth * HOME.grid.cardAspect);

  if (loading) {
    return (
      <View style={styles.skeletonRow} testID="trending-skeleton">
        {Array.from({length: HOME.skeleton.trending}).map((_, i) => (
          <Shimmer key={i} style={{width: cardWidth, height: cardHeight, borderRadius: 18}} />
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
      contentContainerStyle={styles.content}
      initialNumToRender={4}
      windowSize={5}
      renderItem={({item, index}) => (
        <VideoCard video={item} width={cardWidth} rank={index + 1} onOpen={onOpenVideo} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {paddingHorizontal: HOME.grid.padding, gap: HOME.trending.gap, paddingVertical: 6},
  skeletonRow: {
    flexDirection: 'row',
    gap: HOME.trending.gap,
    paddingHorizontal: HOME.grid.padding,
    overflow: 'hidden',
  },
});
