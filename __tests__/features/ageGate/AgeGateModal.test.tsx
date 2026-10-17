import {fireEvent, render, screen} from '@testing-library/react-native';
import {Modal} from 'react-native';
import {AgeGateModal} from '../../../src/features/ageGate';
import {AGE_GATE_COPY} from '../../../src/features/ageGate/ageGateConfig';

function setup(visible = true) {
  const onConfirm = jest.fn();
  const onDecline = jest.fn();
  render(
    <AgeGateModal
      visible={visible}
      onConfirm={onConfirm}
      onDecline={onDecline}
    />,
  );
  return {onConfirm, onDecline};
}

describe('AgeGateModal', () => {
  it('asks the age question with a confirm and a cancel button', () => {
    setup();

    expect(screen.getByText(AGE_GATE_COPY.title)).toBeOnTheScreen();
    expect(screen.getByText(AGE_GATE_COPY.body)).toBeOnTheScreen();
    expect(screen.getByTestId('age-gate-badge')).toHaveTextContent('18+');
    expect(
      screen.getByRole('button', {name: AGE_GATE_COPY.confirm}),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('button', {name: AGE_GATE_COPY.cancel}),
    ).toBeOnTheScreen();
  });

  it('announces the question as a heading for screen readers', () => {
    setup();

    expect(screen.getByRole('header')).toHaveTextContent(AGE_GATE_COPY.title);
  });

  it('shows nothing when not visible', () => {
    setup(false);

    expect(screen.queryByTestId('age-gate-modal')).toBeNull();
    expect(screen.queryByText(AGE_GATE_COPY.title)).toBeNull();
  });

  it('calls onConfirm (and not onDecline) when Confirm is pressed', () => {
    const {onConfirm, onDecline} = setup();

    fireEvent.press(screen.getByTestId('age-gate-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
  });

  it('calls onDecline (and not onConfirm) when Cancel is pressed', () => {
    const {onConfirm, onDecline} = setup();

    fireEvent.press(screen.getByTestId('age-gate-cancel'));

    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('treats the Android Back button as Cancel', () => {
    const {onConfirm, onDecline} = setup();

    screen.UNSAFE_getByType(Modal).props.onRequestClose();

    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cannot be dismissed any other way', () => {
    setup();

    expect(screen.UNSAFE_getByType(Modal).props.transparent).toBe(true);
    expect(screen.UNSAFE_getByType(Modal).props.onDismiss).toBeUndefined();
  });

  // Regression: Android keeps the app process alive after "Cancel" / Back, so
  // reopening the app shows the SAME pop-up. The buttons must still respond.
  describe('after Cancel or Back (app reopened from the background)', () => {
    it('Confirm still works after Cancel was pressed earlier', () => {
      const {onConfirm, onDecline} = setup();

      fireEvent.press(screen.getByTestId('age-gate-cancel'));
      fireEvent.press(screen.getByTestId('age-gate-confirm'));

      expect(onDecline).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('both buttons still work after the Back button was pressed', () => {
      const {onConfirm, onDecline} = setup();

      screen.UNSAFE_getByType(Modal).props.onRequestClose();
      fireEvent.press(screen.getByTestId('age-gate-cancel'));
      fireEvent.press(screen.getByTestId('age-gate-confirm'));

      expect(onDecline).toHaveBeenCalledTimes(2);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('Cancel works again every time it is pressed', () => {
      const {onDecline} = setup();

      fireEvent.press(screen.getByTestId('age-gate-cancel'));
      fireEvent.press(screen.getByTestId('age-gate-cancel'));

      expect(onDecline).toHaveBeenCalledTimes(2);
    });
  });
});
