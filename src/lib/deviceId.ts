import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_KEY = '@luminxn/device-id';
let cached: string | null = null;

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Stable anonymous per-device id (ready for likes / bookmarks / progress). Never throws. */
export async function getDeviceId(): Promise<string> {
  if (cached) {
    return cached;
  }
  try {
    const saved = await AsyncStorage.getItem(DEVICE_KEY);
    if (saved) {
      cached = saved;
      return saved;
    }
    const fresh = uuid();
    cached = fresh;
    await AsyncStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    cached = cached ?? uuid();
    return cached;
  }
}
