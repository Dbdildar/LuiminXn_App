import {render, screen} from '@testing-library/react-native';
import App from '../App';
import {SPLASH} from '../src/screens/Splash/splashConfig';
import {advance, flushPromises, useMotionTimers} from './helpers/motion';

describe('App', () => {
  beforeEach(() => {
    useMotionTimers();
  });

  it('opens on the splash screen, not the home screen', async () => {
    render(<App />);
    await flushPromises();

    expect(screen.getByTestId('splash-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('home-screen')).toBeNull();
  });

  it('has no login or registration step', async () => {
    render(<App />);
    await flushPromises();
    await advance(SPLASH.totalDuration);

    expect(screen.queryByText(/log ?in/i)).toBeNull();
    expect(screen.queryByText(/sign ?(in|up)/i)).toBeNull();
    expect(screen.queryByText(/regist/i)).toBeNull();
  });

  it('goes straight to the home screen when the splash finishes', async () => {
    render(<App />);
    await flushPromises();

    await advance(SPLASH.totalDuration - 1);
    expect(screen.getByTestId('splash-screen')).toBeOnTheScreen();

    await advance(1);
    expect(screen.getByTestId('home-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('splash-screen')).toBeNull();
  });
});
