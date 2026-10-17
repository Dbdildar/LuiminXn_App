/**
 * Global Jest setup for LuminXn unit / component tests.
 */
import React from 'react';
import {AccessibilityInfo} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Replace your react-native-screens mock in jest.setup.ts with this:
jest.mock('react-native-screens', () => {
  const React = require('react');
  const View = (props: any) => React.createElement('View', props);
  
  return {
    enableScreens: jest.fn(),
    enableFreeze: jest.fn(),
    shouldUseActivityState: jest.fn(),
    ScreenContainer: View,
    Screen: View,
    NativeScreen: View,
    NativeScreenContainer: View,
    FullWindowOverlay: View,
    // Add default export mapping to support ES modules compatibility:
    default: {
      enableScreens: jest.fn(),
      ScreenContainer: View,
      Screen: View,
    },
  };
});
// Native stack needs real native screens. In tests, use a plain JS stack that
// renders only the focused route (same navigate / goBack behaviour).
jest.mock('@react-navigation/native-stack', () => {
  const mockReact = require('react');
  const {
    createNavigatorFactory,
    useNavigationBuilder,
    StackRouter,
  } = require('@react-navigation/native');

  function MockStackNavigator({
    id,
    initialRouteName,
    children,
    screenListeners,
    screenOptions,
  }: any) {
    const {state, descriptors, NavigationContent} = useNavigationBuilder(
      StackRouter,
      {id, initialRouteName, children, screenListeners, screenOptions},
    );
    const route = state.routes[state.index];
    return mockReact.createElement(
      NavigationContent,
      null,
      descriptors[route.key].render(),
    );
  }

  return {createNativeStackNavigator: createNavigatorFactory(MockStackNavigator)};
});
// Add this to your jest.setup.ts file:
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({children}: {children: React.ReactNode}) => React.createElement(React.Fragment, {}, children),
      Screen: ({children, component: Component, render}: any) => {
        if (Component) return React.createElement(Component);
        if (render) return render();
        return children || null;
      },
    }),
  };
});

jest.mock('react-native-svg', () => {
  const mockReact = require('react');
  const {View, Text: RNText} = require('react-native');

  const make = (name: string) => {
    const Component = (props: Record<string, unknown>) =>
      mockReact.createElement(View, {
        ...props,
        testID: props.testID ?? `svg-${name}`,
      });
    Component.displayName = name;
    return Component;
  };

  // SVG <Text> holds a string, so it must be a real RN Text.
  const SvgText = (props: Record<string, unknown>) =>
    mockReact.createElement(RNText, {...props, testID: props.testID ?? 'svg-Text'});
  SvgText.displayName = 'SvgText';

  const Svg = make('Svg');
  return {
    __esModule: true,
    default: Svg,
    Svg,
    Circle: make('Circle'),
    Defs: make('Defs'),
    G: make('G'),
    Path: make('Path'),
    Polygon: make('Polygon'),
    Polyline: make('Polyline'),
    Rect: make('Rect'),
    Stop: make('Stop'),
    Text: SvgText,
    LinearGradient: make('LinearGradient'),
    RadialGradient: make('RadialGradient'),
  };
});

// AsyncStorage is native; use the official in-memory mock in tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// ---- Home feature: native / network modules replaced with test doubles ----
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js'),
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('react-native-video', () => {
  const mockReact = require('react');
  const {View} = require('react-native');
  const Video = (props: {source?: {uri?: string}}) =>
    mockReact.createElement(View, {
      testID: 'preview-video',
      accessibilityLabel: props.source?.uri,
    });
  return {__esModule: true, default: Video};
});

// Never load the real Supabase library in tests (tests that need a builder
// override this with their own jest.mock, e.g. videoApi.test.ts).
jest.mock('./src/lib/supabase', () => ({
  SUPABASE_URL: 'https://test.supabase.co',
  supabase: {from: jest.fn(), rpc: jest.fn()},
}));

// Keep React import used so isolatedModules does not strip the file's module scope.
export const __jestSetupReact = React;

const ONLINE = {isConnected: true, isInternetReachable: true};

// Every test starts with "reduce motion" OFF; tests opt in with mockReduceMotion(true).
beforeEach(async () => {
  // Every test starts like a brand-new install: nothing saved on the phone.
  await AsyncStorage.clear();
  (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(
    false,
  );

  // Re-apply NetInfo defaults every time: jest.restoreAllMocks() in a test's
  // afterEach can wipe them. Tests may override these in their own beforeEach.
  (NetInfo.fetch as jest.Mock).mockResolvedValue(ONLINE);
  (NetInfo.refresh as jest.Mock).mockResolvedValue(ONLINE);
  (NetInfo.addEventListener as jest.Mock).mockReturnValue(jest.fn());
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});