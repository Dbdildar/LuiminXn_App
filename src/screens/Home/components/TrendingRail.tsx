import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Shimmer } from '../../../components/ui/Shimmer';
import type { VideoItem } from '../../../features/videos';
import { HOME } from '../homeConfig';
import { CARD_THUMB_RATIO, VideoCard, getCaptionHeight } from './VideoCard';

type Props = {
  videos: VideoItem[];
  loading: boolean;
  onOpenVideo: (video: VideoItem) => void;
    onScrollBeginDrag?: () => void;
};

const VISIBLE = 2;
const MAX_CONTENT_WIDTH = 720;

const Separator = () => <View style={{ width: HOME.grid.gap }} />;

/** Horizontal trending row. Cards are sized so exactly 2 fit per screen. */
export function TrendingRail({ videos, loading, onOpenVideo ,onScrollBeginDrag}: Props) {
  const { width } = useWindowDimensions();
  const usable = Math.min(width, MAX_CONTENT_WIDTH) - HOME.grid.padding * 2 - HOME.grid.gap * (VISIBLE - 1);
  const cardWidth = Math.max(Math.floor(usable / VISIBLE), 100);
  const step = cardWidth + HOME.grid.gap;

  if (loading) {
    return (
      <View style={styles.content} testID="trending-skeleton">
        {Array.from({ length: VISIBLE }).map((_, i) => (
          <View key={i} style={{ width: cardWidth }}>
            <Shimmer
              style={{ width: cardWidth, height: Math.round(cardWidth * CARD_THUMB_RATIO), borderRadius: 16 }}
            />
            <View style={{ height: getCaptionHeight(cardWidth), paddingTop: 8, gap: 6 }}>
              <Shimmer style={{ height: 12, borderRadius: 6, width: '85%' }} />
              <Shimmer style={{ height: 10, borderRadius: 5, width: '45%' }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      testID="trending-rail"
      horizontal
      onScrollBeginDrag={onScrollBeginDrag}
      data={videos}
      keyExtractor={v => v.id}
      showsHorizontalScrollIndicator={false}
      snapToInterval={step}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={Separator}
      style={styles.list}
      renderItem={({ item, index }) => (
        <VideoCard video={item} width={cardWidth} onOpen={onOpenVideo} rank={index + 1} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { overflow: 'visible' },
  listContent: { paddingHorizontal: HOME.grid.padding, paddingVertical: 10 },
  content: {
    flexDirection: 'row',
    gap: HOME.grid.gap,
    paddingHorizontal: HOME.grid.padding,
    paddingVertical: 10,
  },
});

export default TrendingRail;