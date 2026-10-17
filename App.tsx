import {QueryClientProvider} from '@tanstack/react-query';
import {useCallback, useState} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AgeGateScreen, useAgeGate} from './src/features/ageGate';
import {NetworkGate, configureNetInfo, useNetworkStatus} from './src/features/network';
import {PreviewProvider} from './src/features/preview';
import {createQueryClient} from './src/lib/queryClient';
import {RootNavigator} from './src/navigation/RootNavigator';
import {SplashScreen} from './src/screens/Splash';
import {colors} from './src/theme';

configureNetInfo();

/**
 * App root. Order of screens:
 *   1. Animated splash (every launch)
 *   2. Internet check ("Your internet is not connected" if offline)
 *   3. "Are you 18+?" pop-up (only until the user has confirmed once)
 *   4. Home -> Video detail
 *
 * No login or registration. Age answer and connectivity are both read while
 * the splash plays, so nothing flickers when it ends.
 */
function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [queryClient] = useState(createQueryClient);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  const {status, confirm, decline} = useAgeGate();
  const network = useNetworkStatus();

  let screen;
  if (!splashDone) {
    screen = <SplashScreen onFinish={handleSplashFinish} />;
  } else {
    screen = (
      <NetworkGate status={network.status} retrying={network.retrying} onRetry={network.retry}>
        {status === 'verified' ? (
          <RootNavigator />
        ) : (
          <AgeGateScreen status={status} onConfirm={confirm} onDecline={decline} />
        )}
      </NetworkGate>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PreviewProvider>
          <StatusBar barStyle="light-content" backgroundColor={colors.ink} translucent={false} />
          {screen}
        </PreviewProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
