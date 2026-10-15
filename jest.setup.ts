/**
 * Global Jest setup for LuminXn unit / component tests.
 *
 * react-native-svg renders native views that do not exist in the Jest
 * environment, so every SVG primitive is replaced with a plain host view.
 * The splash screen logic (timers, callbacks, accessibility) is what we test,
 * not the native SVG renderer.
 */
import React from 'react';
import {AccessibilityInfo} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('react-native-svg', () => {
  const mockReact = require('react');
  const {View} = require('react-native');

  const make = (name: string) => {
    const Component = (props: Record<string, unknown>) =>
      mockReact.createElement(View, {
        ...props,
        testID: props.testID ?? `svg-${name}`,
      });
    Component.displayName = name;
    return Component;
  };

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
    Rect: make('Rect'),
    Stop: make('Stop'),
    LinearGradient: make('LinearGradient'),
    RadialGradient: make('RadialGradient'),
  };
});

// AsyncStorage is native; use the official in-memory mock in tests.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Keep React import used so isolatedModules does not strip the file's module scope.
export const __jestSetupReact = React;

// Every test starts with "reduce motion" OFF; tests opt in with mockReduceMotion(true).
beforeEach(async () => {
  // Every test starts like a brand-new install: nothing saved on the phone.
  await AsyncStorage.clear();
  (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(
    false,
  );
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});
