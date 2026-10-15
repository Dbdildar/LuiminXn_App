import AsyncStorage from '@react-native-async-storage/async-storage';
import {MINIMUM_AGE, RECORD_VERSION, STORAGE_KEY} from './ageGateConfig';

/** What is saved on the phone once the user confirms their age. */
export type AgeVerificationRecord = {
  version: number;
  minimumAge: number;
  /** ISO 8601 time of the confirmation. */
  confirmedAt: string;
};

function logProblem(message: string, error: unknown) {
  // Hook point: send this to Crashlytics / Sentry once you add one.
  if (__DEV__) {
    console.warn(`[ageGate] ${message}`, error);
  }
}

function isValidRecord(value: unknown): value is AgeVerificationRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Partial<AgeVerificationRecord>;

  return (
    record.version === RECORD_VERSION &&
    typeof record.minimumAge === 'number' &&
    record.minimumAge >= MINIMUM_AGE &&
    typeof record.confirmedAt === 'string' &&
    !Number.isNaN(Date.parse(record.confirmedAt))
  );
}

/**
 * Has this device already confirmed the age?
 *
 * Fails closed: if nothing is saved, the data is damaged, or storage cannot be
 * read, the answer is `false` so the age question is shown again. Never throws.
 */
export async function readAgeVerification(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return false;
    }
    return isValidRecord(JSON.parse(raw));
  } catch (error) {
    logProblem('Could not read the saved age confirmation', error);
    return false;
  }
}

/**
 * Remember that the user confirmed their age. Returns `false` if it could not
 * be saved (the user is then simply asked again next time). Never throws.
 */
export async function saveAgeVerification(
  now: Date = new Date(),
): Promise<boolean> {
  const record: AgeVerificationRecord = {
    version: RECORD_VERSION,
    minimumAge: MINIMUM_AGE,
    confirmedAt: now.toISOString(),
  };

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return true;
  } catch (error) {
    logProblem('Could not save the age confirmation', error);
    return false;
  }
}

/** Forget the confirmation (for a "reset" setting or support tooling). Never throws. */
export async function clearAgeVerification(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    logProblem('Could not clear the age confirmation', error);
  }
}
