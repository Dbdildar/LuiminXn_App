import {fireEvent, render, screen} from '@testing-library/react-native';
import {Text} from 'react-native';
import {NetworkGate} from '../../../src/features/network';
import {NO_INTERNET_COPY} from '../../../src/features/network/NoInternetScreen';

const child = <Text testID="child">app</Text>;

describe('NetworkGate', () => {
  it('shows only a dark screen while checking', () => {
    render(<NetworkGate status="checking" retrying={false} onRetry={jest.fn()}>{child}</NetworkGate>);
    expect(screen.getByTestId('network-checking')).toBeOnTheScreen();
    expect(screen.queryByTestId('child')).toBeNull();
    expect(screen.queryByTestId('no-internet-screen')).toBeNull();
  });

  it('renders the app when online', () => {
    render(<NetworkGate status="online" retrying={false} onRetry={jest.fn()}>{child}</NetworkGate>);
    expect(screen.getByTestId('child')).toBeOnTheScreen();
    expect(screen.queryByTestId('no-internet-screen')).toBeNull();
  });

  it('shows the offline message (and not the app) if offline from the start', () => {
    render(<NetworkGate status="offline" retrying={false} onRetry={jest.fn()}>{child}</NetworkGate>);
    expect(screen.getByTestId('no-internet-screen')).toBeOnTheScreen();
    expect(screen.getByText(NO_INTERNET_COPY.title)).toBeOnTheScreen();
    expect(screen.queryByTestId('child')).toBeNull();
  });

  it('keeps the app mounted underneath if the connection drops later', () => {
    const {rerender} = render(
      <NetworkGate status="online" retrying={false} onRetry={jest.fn()}>{child}</NetworkGate>,
    );
    rerender(<NetworkGate status="offline" retrying={false} onRetry={jest.fn()}>{child}</NetworkGate>);

    expect(screen.getByTestId('no-internet-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('child')).toBeOnTheScreen();

    rerender(<NetworkGate status="online" retrying={false} onRetry={jest.fn()}>{child}</NetworkGate>);
    expect(screen.queryByTestId('no-internet-screen')).toBeNull();
  });

  it('calls onRetry when the button is pressed and disables it while retrying', () => {
    const onRetry = jest.fn();
    const {rerender} = render(
      <NetworkGate status="offline" retrying={false} onRetry={onRetry}>{child}</NetworkGate>,
    );
    fireEvent.press(screen.getByTestId('no-internet-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<NetworkGate status="offline" retrying onRetry={onRetry}>{child}</NetworkGate>);
    expect(screen.getByTestId('no-internet-retry').props.accessibilityState).toMatchObject({disabled: true});
  });
});
