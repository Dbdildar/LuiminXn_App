import {StyleSheet, View} from 'react-native';
import {colors} from '../../theme';
import {AgeGateModal} from './AgeGateModal';
import type {AgeGateStatus} from './useAgeGate';

type Props = {
  status: Exclude<AgeGateStatus, 'verified'>;
  onConfirm: () => void;
  onDecline: () => void;
};

/**
 * Shown after the splash for anyone who has not confirmed their age yet.
 *
 * It is a plain dark screen (the same colour the splash fades into) with the
 * pop-up on top, so no app content is visible behind the question. While the
 * saved answer is still being read, only the dark screen shows.
 */
export function AgeGateScreen({status, onConfirm, onDecline}: Props) {
  return (
    <View style={styles.root} testID="age-gate-screen">
      <AgeGateModal
        visible={status === 'required'}
        onConfirm={onConfirm}
        onDecline={onDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
});

export default AgeGateScreen;
