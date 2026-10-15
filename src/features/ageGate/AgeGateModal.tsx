import {useRef} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, fontSizes, fonts} from '../../theme';
import {AGE_GATE_COPY} from './ageGateConfig';

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onDecline: () => void;
};

/**
 * The "Are you 18+?" pop-up.
 *
 * It cannot be dismissed by tapping outside. The Android Back button counts as
 * "Cancel" and closes the app, so there is no way round the question.
 */
export function AgeGateModal({visible, onConfirm, onDecline}: Props) {
  // Stops a fast double tap from firing the action twice.
  const handled = useRef(false);

  const once = (action: () => void) => () => {
    if (handled.current) {
      return;
    }
    handled.current = true;
    action();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={once(onDecline)}>
      <View style={styles.overlay} testID="age-gate-modal">
        <View
          style={styles.card}
          accessibilityViewIsModal
          accessible={false}
          importantForAccessibility="yes">
          <View style={styles.badge}>
            <Text style={styles.badgeText} testID="age-gate-badge">
              {AGE_GATE_COPY.badge}
            </Text>
          </View>

          <Text
            style={styles.title}
            accessibilityRole="header"
            testID="age-gate-title">
            {AGE_GATE_COPY.title}
          </Text>
          <Text style={styles.body}>{AGE_GATE_COPY.body}</Text>

          <Pressable
            testID="age-gate-confirm"
            accessibilityRole="button"
            accessibilityLabel={AGE_GATE_COPY.confirm}
            onPress={once(onConfirm)}
            style={({pressed}) => [
              styles.button,
              styles.confirm,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.confirmText}>{AGE_GATE_COPY.confirm}</Text>
          </Pressable>

          <Pressable
            testID="age-gate-cancel"
            accessibilityRole="button"
            accessibilityLabel={AGE_GATE_COPY.cancel}
            onPress={once(onDecline)}
            style={({pressed}) => [
              styles.button,
              styles.cancel,
              pressed && styles.pressed,
            ]}>
            <Text style={styles.cancelText}>{AGE_GATE_COPY.cancel}</Text>
          </Pressable>

          <Text style={styles.footnote}>{AGE_GATE_COPY.footnote}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(7, 5, 15, 0.86)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.track,
    backgroundColor: colors.dusk,
    elevation: 12,
  },
  badge: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.neon,
  },
  badgeText: {
    color: colors.neon,
    fontFamily: fonts.black,
    fontSize: 24,
  },
  title: {
    marginTop: 20,
    color: colors.filament,
    fontFamily: fonts.medium,
    fontSize: fontSizes.title,
    textAlign: 'center',
  },
  body: {
    marginTop: 10,
    marginBottom: 24,
    color: colors.mist,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
    lineHeight: 23,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  confirm: {
    backgroundColor: colors.neon,
  },
  confirmText: {
    color: colors.filament,
    fontFamily: fonts.medium,
    fontSize: fontSizes.body,
  },
  cancel: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.track,
  },
  cancelText: {
    color: colors.filament,
    fontFamily: fonts.regular,
    fontSize: fontSizes.body,
  },
  pressed: {
    opacity: 0.75,
  },
  footnote: {
    marginTop: 16,
    color: colors.mist,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default AgeGateModal;
