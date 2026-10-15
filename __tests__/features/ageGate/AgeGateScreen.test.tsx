import {render, screen} from '@testing-library/react-native';
import {AgeGateScreen} from '../../../src/features/ageGate';

describe('AgeGateScreen', () => {
  it('shows the pop-up over a plain dark screen when the answer is required', () => {
    render(
      <AgeGateScreen
        status="required"
        onConfirm={jest.fn()}
        onDecline={jest.fn()}
      />,
    );

    expect(screen.getByTestId('age-gate-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('age-gate-modal')).toBeOnTheScreen();
  });

  it('shows only the dark screen while the saved answer is still being read', () => {
    render(
      <AgeGateScreen
        status="checking"
        onConfirm={jest.fn()}
        onDecline={jest.fn()}
      />,
    );

    expect(screen.getByTestId('age-gate-screen')).toBeOnTheScreen();
    expect(screen.queryByTestId('age-gate-modal')).toBeNull();
  });

  it('shows no app content behind the question', () => {
    render(
      <AgeGateScreen
        status="required"
        onConfirm={jest.fn()}
        onDecline={jest.fn()}
      />,
    );

    expect(screen.queryByTestId('home-screen')).toBeNull();
  });
});
