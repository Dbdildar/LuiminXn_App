import {useCallback, useState} from 'react';
import {StatusBar} from 'react-native';
import {HomeScreen} from './src/screens/Home';
import {SplashScreen} from './src/screens/Splash';
import {colors} from './src/theme';

/**
 * App root. Shows the animated splash first, then the home screen.
 * No login or registration: the app goes straight to content.
 */
function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.ink}
        translucent={false}
      />
      {splashDone ? (
        <HomeScreen />
      ) : (
        <SplashScreen onFinish={handleSplashFinish} />
      )}
    </>
  );
}

export default App;
