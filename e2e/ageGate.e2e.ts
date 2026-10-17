import {by, device, element, expect as detoxExpect, waitFor} from 'detox';

/**
 * Age gate ("Are you 18 or older?") on a real Android emulator.
 *
 * `delete: true` uninstalls and reinstalls the app, which gives a true
 * first-time-user state (nothing saved on the phone). A launch without it
 * keeps the saved data, like a returning user.
 *
 * The splash animation never goes idle, so synchronization is off and every
 * check uses waitFor(...).withTimeout(...).
 */
const SPLASH_AND_START_UP = 25000;

async function launch({fresh}: {fresh: boolean}) {
  await device.launchApp({newInstance: true, delete: fresh});
  await device.disableSynchronization();
}

describe('Age gate', () => {
  afterEach(async () => {
    await device.enableSynchronization();
  });

  it('first launch: splash, then the 18+ pop-up, with no home screen behind it', async () => {
    await launch({fresh: true});

    await waitFor(element(by.id('splash-screen')))
      .toBeVisible()
      .withTimeout(15000);

    await waitFor(element(by.id('age-gate-modal')))
      .toBeVisible()
      .withTimeout(SPLASH_AND_START_UP);
    await detoxExpect(element(by.id('age-gate-title'))).toBeVisible();
    await detoxExpect(element(by.id('age-gate-confirm'))).toBeVisible();
    await detoxExpect(element(by.id('age-gate-cancel'))).toBeVisible();
    await detoxExpect(element(by.id('home-screen'))).not.toExist();
  });

  it('Confirm: opens the home screen', async () => {
    await launch({fresh: true});

    await waitFor(element(by.id('age-gate-confirm')))
      .toBeVisible()
      .withTimeout(SPLASH_AND_START_UP);
    await element(by.id('age-gate-confirm')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
    await detoxExpect(element(by.id('age-gate-modal'))).not.toExist();
  });

  it('next launch after confirming: no pop-up, straight to home', async () => {
    // Runs right after the test above, so the confirmation is saved.
    await launch({fresh: false});

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(SPLASH_AND_START_UP);
    await detoxExpect(element(by.id('age-gate-modal'))).not.toExist();
  });

  it('Cancel: nothing is remembered, so the next launch asks again', async () => {
    await launch({fresh: true});

    await waitFor(element(by.id('age-gate-cancel')))
      .toBeVisible()
      .withTimeout(SPLASH_AND_START_UP);
    // Cancel closes the app. Detox cannot observe the close directly, so the
    // proof is the next step: a normal restart shows the pop-up again.
    await element(by.id('age-gate-cancel')).tap();

    await launch({fresh: false});

    await waitFor(element(by.id('age-gate-modal')))
      .toBeVisible()
      .withTimeout(SPLASH_AND_START_UP);
    await detoxExpect(element(by.id('home-screen'))).not.toExist();
  });

  it('Back button, then reopening the same running app: Confirm still works', async () => {
    await launch({fresh: true});

    await waitFor(element(by.id('age-gate-modal')))
      .toBeVisible()
      .withTimeout(SPLASH_AND_START_UP);

    // Back = Cancel: the screen closes but Android keeps the app in memory.
    await device.pressBack();

    // Bring the same app instance back (no new process, no data wipe).
    await device.launchApp({newInstance: false});
    await device.disableSynchronization();

    await waitFor(element(by.id('age-gate-confirm')))
      .toBeVisible()
      .withTimeout(10000);
    await element(by.id('age-gate-confirm')).tap();

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
