import {render, screen} from '@testing-library/react-native';
import {Wordmark} from '../../src/screens/Splash/components';
import {WORDMARK} from '../../src/screens/Splash/splashConfig';
import {advance} from '../helpers/motion';

describe('Wordmark', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it.each([false, true])(
    'spells LuminXn with one accessible label (reduceMotion=%s)',
    reduceMotion => {
      render(<Wordmark reduceMotion={reduceMotion} />);

      const logo = screen.getByTestId('splash-logo');
      expect(logo.props.accessibilityLabel).toBe('LuminXn');
      expect(logo.props.accessibilityRole).toBe('header');
      expect(screen.getByLabelText('LuminXn')).toBeOnTheScreen();
    },
  );

  it('renders every letter in order: L u m i n X n', () => {
    render(<Wordmark reduceMotion={false} />);

    // 5 letters before the X, the X itself, and 1 letter after it.
    expect(screen.getByTestId('splash-logo').children).toHaveLength(
      WORDMARK.before.length + 1 + WORDMARK.after.length,
    );

    expect(screen.getAllByText('n')).toHaveLength(2);
    ['L', 'u', 'm', 'i', 'X'].forEach(char => {
      expect(screen.getByText(char)).toBeOnTheScreen();
    });
  });

  it('matches the brand name from the config', () => {
    const word = [...WORDMARK.before, WORDMARK.accent, ...WORDMARK.after].join(
      '',
    );
    expect(word).toBe(WORDMARK.label);
  });

  it('keeps running animations without errors, then unmounts cleanly', async () => {
    const {unmount} = render(<Wordmark reduceMotion={false} />);

    await advance(6000);

    expect(() => unmount()).not.toThrow();
  });
});
