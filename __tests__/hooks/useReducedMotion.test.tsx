import {AccessibilityInfo, Text} from 'react-native';
import {act, render, screen} from '@testing-library/react-native';
import {useReducedMotion} from '../../src/hooks';
import {flushPromises, mockReduceMotion} from '../helpers/motion';

function Probe() {
  const value = useReducedMotion();
  return <Text testID="probe">{String(value)}</Text>;
}

describe('useReducedMotion', () => {
  it('starts as null (unknown), then reports false', async () => {
    render(<Probe />);
    expect(screen.getByTestId('probe')).toHaveTextContent('null');

    await flushPromises();
    expect(screen.getByTestId('probe')).toHaveTextContent('false');
  });

  it('reports true when the system setting is on', async () => {
    mockReduceMotion(true);
    render(<Probe />);
    await flushPromises();

    expect(screen.getByTestId('probe')).toHaveTextContent('true');
  });

  it('falls back to false if the lookup fails', async () => {
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockRejectedValue(
      new Error('not available'),
    );
    render(<Probe />);
    await flushPromises();

    expect(screen.getByTestId('probe')).toHaveTextContent('false');
  });

  it('follows changes to the setting while mounted', async () => {
    (AccessibilityInfo.addEventListener as jest.Mock).mockClear();
    render(<Probe />);
    await flushPromises();

    const [eventName, listener] = (
      AccessibilityInfo.addEventListener as jest.Mock
    ).mock.calls[0];
    expect(eventName).toBe('reduceMotionChanged');

    act(() => listener(true));
    expect(screen.getByTestId('probe')).toHaveTextContent('true');

    act(() => listener(false));
    expect(screen.getByTestId('probe')).toHaveTextContent('false');
  });

  it('removes its listener on unmount', async () => {
    const remove = jest.fn();
    (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValueOnce({
      remove,
    });
    const {unmount} = render(<Probe />);
    await flushPromises();

    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('ignores a lookup that finishes after unmount', async () => {
    let resolveLookup: (value: boolean) => void = () => {};
    (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockReturnValueOnce(
      new Promise<boolean>(resolve => {
        resolveLookup = resolve;
      }),
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const {unmount} = render(<Probe />);
    unmount();
    await act(async () => resolveLookup(true));

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
