/**
 * Age gate settings.
 *
 * Change MINIMUM_AGE to raise the age limit. Anyone who confirmed under an
 * older, lower limit is asked again, because their saved record no longer
 * meets the rule (see `isValidRecord` in ageGateStorage.ts).
 */
export const MINIMUM_AGE = 18;

/** Bump this if the shape of the saved record ever changes. */
export const RECORD_VERSION = 1;

/** AsyncStorage key. The version suffix lets a future format live alongside this one. */
export const STORAGE_KEY = '@luminxn/age-gate/v1';

export const AGE_GATE_COPY = {
  badge: `${MINIMUM_AGE}+`,
  title: `Are you ${MINIMUM_AGE} or older?`,
  body: `LuminXn contains videos meant for adults. Please confirm that you are ${MINIMUM_AGE} years old or older to continue.`,
  confirm: `Confirm, I'm ${MINIMUM_AGE}+`,
  cancel: 'Cancel',
  footnote: 'We only ask this once. Cancel will close the app.',
} as const;
