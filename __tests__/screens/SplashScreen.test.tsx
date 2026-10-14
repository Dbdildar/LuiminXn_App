import {render, screen} from '@testing-library/react-native';
import {SplashScreen} from '../../src/screens/Splash';
import {SPLASH} from '../../src/screens/Splash/splashConfig';
import {
  advance,
  flushPromises,
  mockReduceMotion,
  useMotionTimers,
} from '../helpers/motion';

describe('SplashScreen', () => {
  beforeEach(() => {
    useMotionTimers();
  });

  it('shows the dark backdrop right away, before the motion setting is known', async () => {
    render(<SplashScreen onFinish={jest.fn()} />);

    expect(screen.getByTestId('splash-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('splash-backdrop')).toBeOnTheScreen();
    expect(screen.queryByTestId('splash-logo')).toBeNull();

    // Let the pending motion-setting lookup finish inside act().
    await flushPromises();
  });

  it('shows the wordmark, tagline and loading line once ready', async () => {
    render(<SplashScreen onFinish={jest.fn()} />);
    await flushPromises();

    expect(screen.getByLabelText('LuminXn')).toBeOnTheScreen();
    expect(screen.getByTestId('splash-logo-x')).toBeOnTheScreen();
    expect(screen.getByText(SPLASH.tagline.text)).toBeOnTheScreen();
    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(screen.getByTestId('splash-beam')).toBeOnTheScreen();
    expect(screen.getByTestId('splash-dust')).toBeOnTheScreen();
  });

  it('does not finish before the full duration', async () => {
    const onFinish = jest.fn();
    render(<SplashScreen onFinish={onFinish} />);
    await flushPromises();

    await advance(SPLASH.totalDuration - 1);

    expect(onFinish).not.toHaveBeenCalled();
  });

  it('calls onFinish once the full duration has passed', async () => {
    const onFinish = jest.fn();
    render(<SplashScreen onFinish={onFinish} />);
    await flushPromises();

    await advance(SPLASH.totalDuration);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('calls onFinish only once, even if time keeps running', async () => {
    const onFinish = jest.fn();
    render(<SplashScreen onFinish={onFinish} />);
    await flushPromises();

    await advance(SPLASH.totalDuration * 3);

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('respects a custom duration', async () => {
    const onFinish = jest.fn();
    render(<SplashScreen onFinish={onFinish} duration={2000} />);
    await flushPromises();

    await advance(1999);
    expect(onFinish).not.toHaveBeenCalled();

    await advance(1);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('calls the latest onFinish callback if it changes while running', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const {rerender} = render(<SplashScreen onFinish={first} />);
    await flushPromises();

    rerender(<SplashScreen onFinish={second} />);
    await advance(SPLASH.totalDuration);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('never calls onFinish after it has been unmounted', async () => {
    const onFinish = jest.fn();
    const {unmount} = render(<SplashScreen onFinish={onFinish} />);
    await flushPromises();

    unmount();
    await advance(SPLASH.totalDuration * 2);

    expect(onFinish).not.toHaveBeenCalled();
  });

  describe('when the system "reduce motion" setting is on', () => {
    beforeEach(() => {
      mockReduceMotion(true);
    });

    it('still shows the full branding', async () => {
      render(<SplashScreen onFinish={jest.fn()} />);
      await flushPromises();

      expect(screen.getByLabelText('LuminXn')).toBeOnTheScreen();
      expect(screen.getByText(SPLASH.tagline.text)).toBeOnTheScreen();
    });

    it('finishes sooner than the full animated splash', async () => {
      const onFinish = jest.fn();
      render(<SplashScreen onFinish={onFinish} />);
      await flushPromises();

      await advance(SPLASH.reducedMotionDuration - 1);
      expect(onFinish).not.toHaveBeenCalled();

      await advance(1);
      expect(onFinish).toHaveBeenCalledTimes(1);
      expect(SPLASH.reducedMotionDuration).toBeLessThan(SPLASH.totalDuration);
    });
  });
});
