import {render, screen} from '@testing-library/react-native';
import {
  Backdrop,
  DustMotes,
  LoadingLine,
  ProjectorBeam,
  Tagline,
} from '../../src/screens/Splash/components';
import {DUST_MOTES, SPLASH} from '../../src/screens/Splash/splashConfig';
import {advance} from '../helpers/motion';

describe('Splash building blocks', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  describe('Backdrop', () => {
    it('renders without intercepting touches', () => {
      render(<Backdrop />);

      expect(screen.getByTestId('splash-backdrop').props.pointerEvents).toBe(
        'none',
      );
    });
  });

  describe('ProjectorBeam', () => {
    it.each([false, true])('renders (reduceMotion=%s)', reduceMotion => {
      render(<ProjectorBeam reduceMotion={reduceMotion} />);

      expect(screen.getByTestId('splash-beam')).toBeOnTheScreen();
    });

    it('keeps breathing and unmounts cleanly', async () => {
      const {unmount} = render(<ProjectorBeam reduceMotion={false} />);
      await advance(9000);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('DustMotes', () => {
    it('renders one speck for every configured mote', () => {
      render(<DustMotes reduceMotion={false} />);

      expect(screen.getByTestId('splash-dust').children).toHaveLength(
        DUST_MOTES.length,
      );
    });

    it('renders static specks when reduce motion is on', async () => {
      render(<DustMotes reduceMotion />);
      await advance(5000);

      expect(screen.getByTestId('splash-dust').children).toHaveLength(
        DUST_MOTES.length,
      );
    });

    it('unmounts cleanly while looping', async () => {
      const {unmount} = render(<DustMotes reduceMotion={false} />);
      await advance(7000);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Tagline', () => {
    it.each([false, true])(
      'shows the tagline text (reduceMotion=%s)',
      reduceMotion => {
        render(<Tagline reduceMotion={reduceMotion} />);

        expect(screen.getByTestId('splash-tagline')).toHaveTextContent(
          SPLASH.tagline.text,
        );
      },
    );
  });

  describe('LoadingLine', () => {
    it('is announced as a loading progress bar', () => {
      render(<LoadingLine reduceMotion={false} duration={2000} />);

      const bar = screen.getByRole('progressbar');
      expect(bar.props.accessibilityLabel).toBe('Loading');
    });

    it('renders when reduce motion is on', () => {
      render(<LoadingLine reduceMotion duration={1000} />);

      expect(screen.getByTestId('splash-loading')).toBeOnTheScreen();
    });

    it('copes with a zero or negative duration', () => {
      expect(() =>
        render(<LoadingLine reduceMotion={false} duration={-50} />),
      ).not.toThrow();
    });
  });
});
