import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Shimmer } from '../../components/ui/Shimmer';
import { VideoPlayer, getPlayerHeight, useFullscreen } from '../../features/player';
import { useVideoFeed, type VideoItem } from '../../features/videos';
import { formatDuration, formatViews } from '../../features/videos/format';
import { useRelatedVideos } from '../../features/videos/useRelatedVideos';
import { useVideoViews } from '../../features/videos/useVideoViews';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { colors, fonts } from '../../theme';
import { HOME } from '../Home/homeConfig';
import { DetailHeader } from './components/DetailHeader';
import { VideoListItem } from './components/VideoListItem';
import { bumpViews, useViewCount } from '../../features/videos/viewsStore';

type Props = {
  video: VideoItem;
  /** Goes straight back to Home, however many videos were played in between. */
  onBack: () => void;
};

const MAX_CONTENT_WIDTH = 840;

function RowSkeleton({ thumbWidth }: { thumbWidth: number }) {
  return (
    <View style={styles.skelRow} testID="detail-skeleton">
      <Shimmer style={{ width: thumbWidth, height: Math.round((thumbWidth * 9) / 16), borderRadius: 10 }} />
      <View style={styles.skelText}>
        <Shimmer style={{ height: 12, borderRadius: 6, width: '90%' }} />
        <Shimmer style={{ height: 12, borderRadius: 6, width: '55%' }} />
      </View>
    </View>
  );
}

export function VideoDetailScreen({ video, onBack }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const fullscreen = useFullscreen();

  const [current, setCurrent] = useState<VideoItem>(video);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const listRef = useRef<FlatList<VideoItem>>(null);

  useEffect(() => setCurrent(video), [video]);

  const trimmed = query.trim();
  const search = useDebouncedValue(trimmed, HOME.search.debounceMs);
  const showResults = searchOpen && trimmed.length > 0; // typing closes the player
  const resultsPending = search !== trimmed;

  const feed = useVideoFeed({ search, category: 'All' });
  const related = useRelatedVideos(current);
  const { views, recordView } = useVideoViews(current);

  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const thumbWidth = Math.min(Math.max(Math.round(contentWidth * 0.4), 120), 240);

  const shownViews = useViewCount(current.id, views);

  // Count the view instantly when a video is opened or picked from the lists.
  useEffect(() => {
    bumpViews(current.id, current.views);
  }, [current.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const all = (feed.data?.pages ?? []).flatMap(p => p.items);
    return Array.from(new Map(all.map(v => [v.id, v])).values());
  }, [feed.data]);
  const total = feed.data?.pages?.[0]?.total ?? results.length;

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchOpen(false);
    setQuery('');
  }, []);

  // Android back closes the search first.
  useEffect(() => {
    if (!searchOpen) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSearch();
      return true;
    });
    return () => sub.remove();
  }, [searchOpen, closeSearch]);

  const handleSelect = useCallback(
    (v: VideoItem) => {
      Keyboard.dismiss();
      setCurrent(v);
      setSearchOpen(false);
      setQuery('');
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    },
    [],
  );

  const handleEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      feed.fetchNextPage().catch(() => { });
    }
  }, [feed]);

  const renderItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <VideoListItem video={item} thumbWidth={thumbWidth} isCurrent={item.id === current.id} onPress={handleSelect} />
    ),
    [thumbWidth, current.id, handleSelect],
  );

  const playerStyle = fullscreen.isFullscreen
    ? styles.fullscreen
    : { width: '100%' as const, height: getPlayerHeight(width, height) };

  const meta = (
    <View style={styles.meta}>
      <Text testID="video-detail-title" style={styles.title} maxFontSizeMultiplier={1.3}>
        {current.title}
      </Text>
      <Text testID="video-detail-views" style={styles.metaLine}>
        {formatViews(shownViews)} views
      </Text>
      <Text style={styles.metaLine} numberOfLines={2}>
        {[current.category, formatDuration(current.durationSeconds), current.actors.join(', ')]
          .filter(Boolean)
          .join(' · ')}
      </Text>
      <Text style={styles.section}>More like this</Text>
    </View>
  );

  const contentStyle = { width: contentWidth, alignSelf: 'center' as const, paddingBottom: insets.bottom + 24 };

  const resultsEmpty =
    resultsPending || feed.isLoading ? (
      <View>
        {[0, 1, 2].map(i => (
          <RowSkeleton key={i} thumbWidth={thumbWidth} />
        ))}
      </View>
    ) : feed.isError ? (
      <Pressable testID="results-retry" onPress={() => feed.refetch()} style={styles.state}>
        <Text style={styles.stateText}>Couldn’t search. Tap to retry</Text>
      </Pressable>
    ) : (
      <View style={styles.state} testID="results-empty">
        <Text style={styles.stateText}>No videos match “{trimmed}”</Text>
      </View>
    );

  const relatedEmpty = related.isLoading ? (
    <View>
      {[0, 1, 2].map(i => (
        <RowSkeleton key={i} thumbWidth={thumbWidth} />
      ))}
    </View>
  ) : related.isError ? (
    <Pressable testID="related-retry" onPress={() => related.refetch()} style={styles.state}>
      <Text style={styles.stateText}>Couldn’t load similar videos. Tap to retry</Text>
    </Pressable>
  ) : (
    <View style={styles.state} testID="related-empty">
      <Text style={styles.stateText}>No similar videos yet</Text>
    </View>
  );

  return (
    <View style={styles.root} testID="video-detail-screen">
      {!fullscreen.isFullscreen && (
        <DetailHeader
          searchOpen={searchOpen}
          query={query}
          topInset={insets.top}
          onBack={onBack}
          onOpenSearch={() => setSearchOpen(true)}
          onCloseSearch={closeSearch}
          onChangeQuery={setQuery}
        />
      )}

      {!showResults && (
        <VideoPlayer
          key={current.id}
          video={current}
          style={playerStyle}
          isFullscreen={fullscreen.isFullscreen}
          onToggleFullscreen={fullscreen.toggle}
          onViewQualified={recordView}
          suspended={searchOpen}
        />
      )}

      {!fullscreen.isFullscreen &&
        (showResults ? (
          <FlatList
            key="results"
            ref={listRef}
            testID="video-detail-results"
            data={resultsPending || feed.isLoading ? [] : results}
            keyExtractor={v => v.id}
            renderItem={renderItem}
            ListHeaderComponent={
              <Text style={[styles.section, styles.resultsTitle]}>
                Results for “{search || trimmed}” ({total})
              </Text>
            }
            ListEmptyComponent={resultsEmpty}
            ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={colors.neon} style={styles.footer} /> : null}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.6}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={contentStyle}
          />
        ) : (
          <FlatList
            key="related"
            ref={listRef}
            testID="video-detail-related"
            data={related.data ?? []}
            keyExtractor={v => v.id}
            renderItem={renderItem}
            ListHeaderComponent={meta}
            ListEmptyComponent={relatedEmpty}
            contentContainerStyle={contentStyle}
            showsVerticalScrollIndicator={false}
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  fullscreen: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20, borderRadius: 10 },
  meta: { paddingHorizontal: 12, paddingTop: 12, gap: 4 },
  title: { color: colors.filament, fontFamily: fonts.black, fontSize: 18 },
  metaLine: { color: colors.mist, fontFamily: fonts.medium, fontSize: 12 },
  section: { color: colors.filament, fontFamily: fonts.black, fontSize: 15, marginTop: 12, marginBottom: 4 },
  resultsTitle: { paddingHorizontal: 12 },
  skelRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  skelText: { flex: 1, gap: 8, justifyContent: 'center' },
  state: { alignItems: 'center', paddingVertical: 28 },
  stateText: { color: colors.mist, fontFamily: fonts.medium, fontSize: 12 },
  footer: { paddingVertical: 20 },
});

export default VideoDetailScreen;
