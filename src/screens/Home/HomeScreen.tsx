import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreview } from '../../features/preview';
import {
  useCategories,
  useTrending,
  useVideoFeed,
  type VideoItem,
} from '../../features/videos';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { colors, fonts } from '../../theme';
import {
  CategoryRail,
  CollapsingSearchHeader,
  EmptyState,
  GridSkeleton,
  SectionTitle,
  TrendingRail,
  VideoCard,
} from './components';
import { HOME, getCardWidth, getColumns, getContentWidth } from './homeConfig';

type Props = {
  /** Called when a video is opened (second tap on a previewing card). */
  onOpenVideo?: (video: VideoItem) => void;
};



const noop = () => { };

export function HomeScreen({ onOpenVideo = noop }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { stopPreview } = usePreview();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const search = useDebouncedValue(query.trim(), HOME.search.debounceMs);
  const isSearching = search.length > 0;

  const feed = useVideoFeed({ search, category });
  const categoriesQuery = useCategories();
  const trendingQuery = useTrending(HOME.trending.limit);
  const { refetch: refetchFeed, fetchNextPage, hasNextPage, isFetchingNextPage } = feed;
  const { refetch: refetchCategories } = categoriesQuery;
  const { refetch: refetchTrending } = trendingQuery;

  const listRef = useRef<FlatList<VideoItem>>(null);

  // Responsive: always 3 columns, content capped + centred on tablets.
  const columns = getColumns(width);
  const cardWidth = getCardWidth(width, columns);
  const contentWidth = getContentWidth(width);


  const stopPreviewRef = useRef(stopPreview);

  stopPreviewRef.current = stopPreview;
  const stopAllPreviews = useCallback(() => stopPreviewRef.current(), []);

  const videos = useMemo(() => {
    const all = (feed.data?.pages ?? []).flatMap(p => p.items);
    return Array.from(new Map(all.map(v => [v.id, v])).values());
  }, [feed.data]);
  const total = feed.data?.pages?.[0]?.total ?? 0;
  const trending = trendingQuery.data?.items ?? [];

  const showTrending = !isSearching && category === 'All';
  const expanded = !scrolled || searchOpen;


  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setScrolled(prev => (prev ? y > HOME.header.expandAt : y > HOME.header.collapseAt));
  }, []);

 useEffect(() => {
  listRef.current?.scrollToOffset({offset: 0, animated: false});
  stopAllPreviews();
}, [search, category, stopAllPreviews]);

const handleScrollBeginDrag = useCallback(() => {
  setSearchOpen(false);
  Keyboard.dismiss();
  stopAllPreviews();
}, [stopAllPreviews]);

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleSelectCategory = useCallback((c: string) => setCategory(c), []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => { });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchFeed(), refetchCategories(), refetchTrending()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchFeed, refetchCategories, refetchTrending]);

  const handleRetry = useCallback(() => {
    refetchFeed().catch(() => { });
    refetchCategories().catch(() => { });
    refetchTrending().catch(() => { });
  }, [refetchFeed, refetchCategories, refetchTrending]);

  const renderItem = useCallback(
    ({ item }: { item: VideoItem }) => (
      <VideoCard video={item} width={cardWidth} onOpen={onOpenVideo} />
    ),
    [cardWidth, onOpenVideo],
  );

  const gridTitle = isSearching
    ? `Results for “${search}” (${total})`
    : category === 'All'
      ? 'All Videos'
      : category;

  const listHeader = (
    <View>
      <CategoryRail
        categories={categoriesQuery.data ?? []}
        active={category}
        loading={categoriesQuery.isLoading}
        onSelect={handleSelectCategory}
      />
      {showTrending && (trendingQuery.isLoading || trending.length > 0) && (
        <>
          <SectionTitle icon="trending-up" title="Trending Now" />
          <TrendingRail
            videos={trending}
            loading={trendingQuery.isLoading}
            onOpenVideo={onOpenVideo}
            onScrollBeginDrag={stopAllPreviews}
          />
        </>
      )}
      <SectionTitle icon={isSearching ? 'search' : 'film'} title={gridTitle} />
    </View>
  );

  let footer = null;
  if (isFetchingNextPage) {
    footer = <ActivityIndicator color={colors.neon} style={styles.footer} testID="home-next-loader" />;
  } else if (feed.isFetchNextPageError) {
    footer = (
      <Pressable onPress={handleEndReached} style={styles.footer} testID="home-next-retry">
        <Text style={styles.footerText}>Couldn’t load more. Tap to retry</Text>
      </Pressable>
    );
  } else if (!hasNextPage && videos.length > 0) {
    footer = (
      <View style={styles.footer}>
        <Text style={styles.footerText}>You’re all caught up</Text>
      </View>
    );
  }

  const empty = feed.isLoading ? (
    <GridSkeleton columns={columns} cardWidth={cardWidth} />
  ) : (
    <EmptyState error={feed.isError} onRetry={handleRetry} />
  );

  return (
    <View style={styles.root} testID="home-screen">
      <FlatList
        ref={listRef}
        testID="home-list"
        data={feed.isLoading ? [] : videos}
        numColumns={columns}
        keyExtractor={v => v.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{
          width: contentWidth,
          alignSelf: 'center',
          paddingTop: insets.top + HOME.header.expandedHeight,
          paddingBottom: insets.bottom + 32,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={handleScrollBeginDrag}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.6}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // clipped subviews + playing video + 3D transforms flicker on Android
        removeClippedSubviews={false}
        initialNumToRender={columns * 3}
        maxToRenderPerBatch={columns * 3}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.neon}
            progressViewOffset={insets.top + HOME.header.expandedHeight}
          />
        }
      />

      <CollapsingSearchHeader
        query={query}
        onChangeQuery={setQuery}
        expanded={expanded}
        onExpand={() => setSearchOpen(true)}
        onSubmit={handleSubmit}
        topInset={insets.top}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  row: {
    gap: HOME.grid.gap,
    paddingHorizontal: HOME.grid.padding,
    marginBottom: HOME.grid.gap + 6,
  },
  footer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  footerText: { color: colors.mist, fontFamily: fonts.medium, fontSize: 11 },
});

export default HomeScreen;
