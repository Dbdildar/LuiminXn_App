import {by, device, element, expect as detoxExpect, waitFor} from 'detox';

/**
 * Splash screen on a real Android emulator.
 *
 * Detox normally waits for the app to be "idle". The neon X shivers and blinks
 * in an endless loop, so synchronization is switched off and every check uses
 * an explicit waitFor(...).withTimeout(...) instead.
 */
describe('Splash screen', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true});
    await device.disableSynchronization();
  });

  afterAll(async () => {
    await device.enableSynchronization();
  });

  it('opens on the splash screen with the LuminXn wordmark', async () => {
    await waitFor(element(by.id('splash-screen')))
      .toBeVisible()
      .withTimeout(15000);
    await waitFor(element(by.id('splash-logo')))
      .toBeVisible()
      .withTimeout(10000);
    await detoxExpect(element(by.label('LuminXn'))).toExist();
  });

  it('shows the neon X as part of the wordmark', async () => {
    await waitFor(element(by.id('splash-logo-x')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('shows the loading line', async () => {
    await detoxExpect(element(by.id('splash-loading'))).toExist();
  });

  it('shows the tagline', async () => {
    await waitFor(element(by.id('splash-tagline')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('does not ask the user to log in or register', async () => {
    await detoxExpect(element(by.text('Log in'))).not.toExist();
    await detoxExpect(element(by.text('Sign up'))).not.toExist();
    await detoxExpect(element(by.text('Register'))).not.toExist();
  });
});
