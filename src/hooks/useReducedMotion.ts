import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';

/**
 * Returns whether the user asked the system to reduce motion.
 * `null` means the answer is not known yet (first render), so callers can
 * wait before starting any animation instead of flashing the wrong state.
 */
export function useReducedMotion(): boolean | null {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => {
        if (mounted) {
          setReduceMotion(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      },
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
