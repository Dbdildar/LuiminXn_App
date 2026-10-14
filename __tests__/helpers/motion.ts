import {AccessibilityInfo} from 'react-native';
import {act} from '@testing-library/react-native';

/**
 * Fake timers for animation tests.
 *
 * `setImmediate` stays real because React Native's <StatusBar> schedules its
 * native update with it, and faking it makes an async act() wait forever.
 */
export function useMotionTimers() {
  jest.useFakeTimers({doNotFake: ['setImmediate', 'clearImmediate']});
}

/** Make the system "reduce motion" setting report `enabled` for this test. */
export function mockReduceMotion(enabled: boolean) {
  (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(
    enabled,
  );
}

/** Let pending promises (e.g. the reduce-motion lookup) settle. */
export async function flushPromises() {
  await act(async () => {});
}

/** Move fake timers forward inside act() so React state updates are applied. */
export async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}
