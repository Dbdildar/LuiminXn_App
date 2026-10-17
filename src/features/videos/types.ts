export type VideoItem = {
  id: string;
  title: string;
  videoUrl: string;
  poster: string;
  category: string;
  actors: string[];
  durationSeconds: number;
  views: number;
};

export type VideoPage = {
  items: VideoItem[];
  nextOffset: number | null;
  total: number;
};

export type FeedParams = {
  search?: string;
  /** "All" or a category name. */
  category?: string;
  offset?: number;
  limit?: number;
  sort?: 'recent' | 'views';
};

export type VideoRow = {
  id: string;
  title: string;
  video_url: string;
  poster_uri: string;
  category: string;
  actors: string[] | null;
  duration_seconds: number | null;
  views: number | null;
};
