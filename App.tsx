import {useCallback, useState} from 'react';
import {StatusBar} from 'react-native';
import {AgeGateScreen, useAgeGate} from './src/features/ageGate';
import {HomeScreen} from './src/screens/Home';
import {SplashScreen} from './src/screens/Splash';
import {colors} from './src/theme';

/**
 * App root. Order of screens:
 *   1. Animated splash (every launch)
 *   2. "Are you 18+?" pop-up (only until the user has confirmed once)
 *   3. Home
 *
 * No login or registration. The saved age answer is read while the splash plays.
 */
function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  const {status, confirm, decline} = useAgeGate();

  let screen;
  if (!splashDone) {
    screen = <SplashScreen onFinish={handleSplashFinish} />;
  } else if (status === 'verified') {
    screen = <HomeScreen />;
  } else {
    screen = (
      <AgeGateScreen status={status} onConfirm={confirm} onDecline={decline} />
    );
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.ink}
        translucent={false}
      />
      {screen}
    </>
  );
}

export default App;
