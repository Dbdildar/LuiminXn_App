import {useCallback, useEffect, useRef, useState} from 'react';
import {BackHandler} from 'react-native';
import {readAgeVerification, saveAgeVerification} from './ageGateStorage';

/**
 * checking: still reading the saved answer
 * required: first time (or never confirmed) - the question must be shown
 * verified: already confirmed on this device - go straight to the app
 */
export type AgeGateStatus = 'checking' | 'required' | 'verified';

/**
 * Owns the age gate state for the whole app.
 *
 * The saved answer is read as soon as the app starts, so by the time the splash
 * screen ends the result is normally ready and nothing flickers.
 */
export function useAgeGate() {
  const [status, setStatus] = useState<AgeGateStatus>('checking');
  const confirmed = useRef(false);

  useEffect(() => {
    let active = true;

    readAgeVerification().then(isVerified => {
      // A confirm tap that happened while we were still reading wins.
      if (active && !confirmed.current) {
        setStatus(isVerified ? 'verified' : 'required');
      }
    });

    return () => {
      active = false;
    };
  }, []);

  /** User tapped "Confirm": let them in now and save the answer in the background. */
  const confirm = useCallback(() => {
    if (confirmed.current) {
      return;
    }
    confirmed.current = true;
    setStatus('verified');
    // Never throws. If saving fails the user is simply asked again next launch.
    saveAgeVerification();
  }, []);

  /**
   * User tapped "Cancel" (or pressed Back): close the app. Nothing is saved.
   * Safe to call again: Android may keep the app alive in the background, and
   * when the user reopens it the same pop-up must still work.
   */
  const decline = useCallback(() => {
    if (confirmed.current) {
      return;
    }
    BackHandler.exitApp();
  }, []);

  return {status, confirm, decline};
}
