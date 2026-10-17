import AsyncStorage from '@react-native-async-storage/async-storage';
import {act, fireEvent, render, screen} from '@testing-library/react-native';
import {BackHandler, Modal} from 'react-native';
import App from '../App';
import {saveAgeVerification} from '../src/features/ageGate';
import {STORAGE_KEY} from '../src/features/ageGate/ageGateConfig';
import {SPLASH} from '../src/screens/Splash/splashConfig';
import {advance, flushPromises, useMotionTimers} from './helpers/motion';
import {fetchCategories, fetchVideoPage} from '../src/features/videos/videoApi';


jest.mock('../src/features/videos/videoApi', () => ({
  PAGE_SIZE: 20,
  fetchVideoPage: jest.fn(),
  fetchCategories: jest.fn(),
}));

/** Start the app and let the splash play to its end. */
async function launchAndFinishSplash() {
  const utils = render(<App />);
  await flushPromises();
  await advance(SPLASH.totalDuration);
  return utils;
}

describe('App', () => {
  let exitApp: jest.SpyInstance;

   beforeEach(() => {
    useMotionTimers();
    exitApp = jest.spyOn(BackHandler, 'exitApp').mockImplementation(() => {});
    // Home calls the backend; in tests it gets an empty catalogue.
    (fetchVideoPage as jest.Mock).mockResolvedValue({items: [], total: 0, nextOffset: null});
    (fetchCategories as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens on the splash screen, not the age pop-up or home', async () => {
    render(<App />);
    await flushPromises();

    expect(screen.getByTestId('splash-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('age-gate-modal')).toBeNull();
    expect(screen.queryByTestId('home-screen')).toBeNull();
  });

  it('has no login or registration step', async () => {
    await launchAndFinishSplash();

    expect(screen.queryByText(/log ?in/i)).toBeNull();
    expect(screen.queryByText(/sign ?(in|up)/i)).toBeNull();
    expect(screen.queryByText(/regist/i)).toBeNull();
  });

  describe('first launch (age not confirmed yet)', () => {
    it('keeps the age pop-up hidden until the splash finishes', async () => {
      render(<App />);
      await flushPromises();

      await advance(SPLASH.totalDuration - 1);

      expect(screen.getByTestId('splash-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('age-gate-modal')).toBeNull();
    });

    it('shows the 18+ pop-up right after the splash, with no home screen behind it', async () => {
      await launchAndFinishSplash();

      expect(screen.queryByTestId('splash-screen')).toBeNull();
      expect(screen.getByTestId('age-gate-modal')).toBeOnTheScreen();
      expect(screen.queryByTestId('home-screen')).toBeNull();
    });

    it('Confirm: shows the home screen and remembers the answer', async () => {
      await launchAndFinishSplash();

      fireEvent.press(screen.getByTestId('age-gate-confirm'));
      await flushPromises();

      expect(screen.getByTestId('home-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('age-gate-modal')).toBeNull();
      expect(await AsyncStorage.getItem(STORAGE_KEY)).not.toBeNull();
      expect(exitApp).not.toHaveBeenCalled();
    });

    it('Cancel: closes the app, never shows home and remembers nothing', async () => {
      await launchAndFinishSplash();

      fireEvent.press(screen.getByTestId('age-gate-cancel'));
      await flushPromises();

      expect(exitApp).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('home-screen')).toBeNull();
      expect(await AsyncStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('Cancel, then reopening the still-running app: Confirm works', async () => {
      await launchAndFinishSplash();

      // Android closes the screen but keeps the app in memory.
      fireEvent.press(screen.getByTestId('age-gate-cancel'));
      await flushPromises();
      expect(screen.getByTestId('age-gate-modal')).toBeOnTheScreen();

      // The user comes back and the same pop-up is still on screen.
      fireEvent.press(screen.getByTestId('age-gate-confirm'));
      await flushPromises();

      expect(screen.getByTestId('home-screen')).toBeOnTheScreen();
      expect(await AsyncStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    it('Back, then reopening the still-running app: Cancel and Confirm both work', async () => {
      await launchAndFinishSplash();

      screen.UNSAFE_getByType(Modal).props.onRequestClose();
      await flushPromises();

      fireEvent.press(screen.getByTestId('age-gate-cancel'));
      expect(exitApp).toHaveBeenCalledTimes(2);

      fireEvent.press(screen.getByTestId('age-gate-confirm'));
      await flushPromises();
      expect(screen.getByTestId('home-screen')).toBeOnTheScreen();
    });

    it('Android Back on the pop-up closes the app too', async () => {
      await launchAndFinishSplash();

      screen.UNSAFE_getByType(Modal).props.onRequestClose();

      expect(exitApp).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('home-screen')).toBeNull();
    });
  });

  describe('later launches', () => {
    it('after confirming once, the next launch skips the pop-up', async () => {
      const first = await launchAndFinishSplash();
      fireEvent.press(screen.getByTestId('age-gate-confirm'));
      await flushPromises();
      first.unmount();

      // Brand-new app start, same phone storage.
      await launchAndFinishSplash();

      expect(screen.getByTestId('home-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('age-gate-modal')).toBeNull();
    });

    it('a user who already confirmed still sees the splash first, then home', async () => {
      await saveAgeVerification();
      render(<App />);
      await flushPromises();

      expect(screen.getByTestId('splash-screen')).toBeOnTheScreen();

      await advance(SPLASH.totalDuration - 1);
      expect(screen.getByTestId('splash-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('home-screen')).toBeNull();

      await advance(1);
      expect(screen.getByTestId('home-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('age-gate-modal')).toBeNull();
    });

    it('after Cancel, the next launch asks again (nothing was confirmed)', async () => {
      const first = await launchAndFinishSplash();
      fireEvent.press(screen.getByTestId('age-gate-cancel'));
      await flushPromises();
      first.unmount();

      await launchAndFinishSplash();

      expect(screen.getByTestId('age-gate-modal')).toBeOnTheScreen();
      expect(screen.queryByTestId('home-screen')).toBeNull();
    });

    it('asks again if the saved answer is damaged', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      await AsyncStorage.setItem(STORAGE_KEY, '{broken');

      await launchAndFinishSplash();

      expect(screen.getByTestId('age-gate-modal')).toBeOnTheScreen();
      expect(screen.queryByTestId('home-screen')).toBeNull();
    });
  });

  describe('when storage is slow', () => {
    it('shows only a dark screen (no pop-up flash, no home) until the answer arrives', async () => {
      let resolveRead: (value: string | null) => void = () => {};
      (AsyncStorage.getItem as jest.Mock).mockReturnValueOnce(
        new Promise<string | null>(resolve => {
          resolveRead = resolve;
        }),
      );

      render(<App />);
      await flushPromises();
      await advance(SPLASH.totalDuration);

      expect(screen.getByTestId('age-gate-screen')).toBeOnTheScreen();
      expect(screen.queryByTestId('age-gate-modal')).toBeNull();
      expect(screen.queryByTestId('home-screen')).toBeNull();

      await act(async () => resolveRead(null));

      expect(screen.getByTestId('age-gate-modal')).toBeOnTheScreen();
    });
  });
});
