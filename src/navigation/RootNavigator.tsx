import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useCallback, useEffect } from 'react';
import type { VideoItem } from '../features/videos';
import { HomeScreen } from '../screens/Home';
import { VideoDetailScreen } from '../screens/VideoDetail';
import { colors } from '../theme';
import type { RootStackParamList } from './types';
const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.ink, card: colors.ink, primary: colors.neon },
};


function HomeRoute({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  
  const open = useCallback(
    (video: VideoItem) => navigation?.navigate?.('VideoDetail', { video }),
    [navigation],
  );
 useEffect(() => {

  }, [navigation]);
  return <HomeScreen onOpenVideo={open} />;
}

function DetailRoute({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'VideoDetail'>) {
  const video = route?.params?.video;

  // Fallback if video data or navigation is missing during tests/direct renders
  if (!video) {
    return null;
  }

  return (
    <VideoDetailScreen
      video={video}
      onBack={() => navigation?.goBack?.()}
    />
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.ink },
        }}>
        <Stack.Screen name="Home" component={HomeRoute} />
        <Stack.Screen name="VideoDetail" component={DetailRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
