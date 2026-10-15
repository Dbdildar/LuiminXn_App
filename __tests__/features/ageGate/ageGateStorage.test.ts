import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MINIMUM_AGE,
  RECORD_VERSION,
  STORAGE_KEY,
} from '../../../src/features/ageGate/ageGateConfig';
import {
  clearAgeVerification,
  readAgeVerification,
  saveAgeVerification,
} from '../../../src/features/ageGate/ageGateStorage';

const validRecord = {
  version: RECORD_VERSION,
  minimumAge: MINIMUM_AGE,
  confirmedAt: '2026-10-14T12:00:00.000Z',
};

describe('ageGateStorage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('readAgeVerification', () => {
    it('is false on a brand-new install', async () => {
      expect(await readAgeVerification()).toBe(false);
    });

    it('is true when a valid record is saved', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(validRecord));

      expect(await readAgeVerification()).toBe(true);
    });

    it('is false when the saved text is not valid JSON', async () => {
      await AsyncStorage.setItem(STORAGE_KEY, '{not json');

      expect(await readAgeVerification()).toBe(false);
    });

    it.each([
      ['a bare true', 'true'],
      ['null', 'null'],
      ['a number', '42'],
      ['an empty object', '{}'],
      ['an array', '[]'],
    ])('is false when the saved value is %s', async (_name, raw) => {
      await AsyncStorage.setItem(STORAGE_KEY, raw);

      expect(await readAgeVerification()).toBe(false);
    });

    it('is false for a record from another format version', async () => {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({...validRecord, version: RECORD_VERSION + 1}),
      );

      expect(await readAgeVerification()).toBe(false);
    });

    it('is false for a record made under a lower age limit', async () => {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({...validRecord, minimumAge: MINIMUM_AGE - 1}),
      );

      expect(await readAgeVerification()).toBe(false);
    });

    it('is true for a record made under a higher age limit', async () => {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({...validRecord, minimumAge: MINIMUM_AGE + 3}),
      );

      expect(await readAgeVerification()).toBe(true);
    });

    it('is false when the date is missing or not a date', async () => {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({...validRecord, confirmedAt: 'yesterday-ish'}),
      );
      expect(await readAgeVerification()).toBe(false);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({version: RECORD_VERSION, minimumAge: MINIMUM_AGE}),
      );
      expect(await readAgeVerification()).toBe(false);
    });

    it('is false, and does not throw, when storage cannot be read', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('disk error'),
      );

      await expect(readAgeVerification()).resolves.toBe(false);
    });
  });

  describe('saveAgeVerification', () => {
    it('saves a versioned record with the time of confirmation', async () => {
      const now = new Date('2026-10-14T09:30:00.000Z');

      const saved = await saveAgeVerification(now);

      expect(saved).toBe(true);
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(raw as string)).toEqual({
        version: RECORD_VERSION,
        minimumAge: MINIMUM_AGE,
        confirmedAt: '2026-10-14T09:30:00.000Z',
      });
    });

    it('can be read back as verified', async () => {
      await saveAgeVerification();

      expect(await readAgeVerification()).toBe(true);
    });

    it('returns false, and does not throw, when storage cannot be written', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('disk full'),
      );

      await expect(saveAgeVerification()).resolves.toBe(false);
      expect(await readAgeVerification()).toBe(false);
    });
  });

  describe('clearAgeVerification', () => {
    it('forgets a saved confirmation', async () => {
      await saveAgeVerification();
      await clearAgeVerification();

      expect(await readAgeVerification()).toBe(false);
    });

    it('does not throw when storage cannot be written', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(
        new Error('disk error'),
      );

      await expect(clearAgeVerification()).resolves.toBeUndefined();
    });
  });
});
