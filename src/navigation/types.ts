import type {VideoItem} from '../features/videos';

export type RootStackParamList = {
  Home: undefined;
  VideoDetail: {video: VideoItem};
};
