import {render, screen} from '@testing-library/react-native';
import {StyleSheet} from 'react-native';
import {NeonX} from '../../src/screens/Splash/components';
import {colors} from '../../src/theme';
import {advance} from '../helpers/motion';

describe('NeonX', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('renders a bold neon-coloured X', () => {
    render(<NeonX reduceMotion={false} />);

    const x = screen.getByText('X');
    const style = StyleSheet.flatten(x.props.style);

    expect(screen.getByTestId('splash-logo-x')).toBeOnTheScreen();
    expect(style.fontWeight).toBe('900');
    expect(style.color).toBe(colors.neon);
    expect(style.textShadowColor).toBe(colors.neon);
  });

  it('starts unlit when animating, so the ignition can play', () => {
    render(<NeonX reduceMotion={false} />);

    const style = StyleSheet.flatten(screen.getByText('X').props.style);
    expect(style.opacity).toBe(0);
  });

  it('is fully lit and still when reduce motion is on', async () => {
    render(<NeonX reduceMotion />);
    await advance(8000);

    const style = StyleSheet.flatten(screen.getByText('X').props.style);
    expect(style.opacity).toBe(1);
  });

  it('shivers and blinks forever without crashing', async () => {
    const {unmount} = render(<NeonX reduceMotion={false} />);

    await advance(10000);

    expect(screen.getByText('X')).toBeOnTheScreen();
    expect(() => unmount()).not.toThrow();
  });
});
