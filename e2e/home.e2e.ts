import {by, device, element, expect as detoxExpect, waitFor} from 'detox';

/**
 * Start-up flow for a returning user: splash -> home, with no login,
 * registration or age pop-up (the age gate has its own file: ageGate.e2e.ts).
 */
describe('App start-up flow', () => {
  beforeAll(async () => {
    // First-time user: install fresh and confirm the age once, so every test
    // below behaves like a returning user.
    await device.launchApp({newInstance: true, delete: true});
    await device.disableSynchronization();
    await waitFor(element(by.id('age-gate-confirm')))
      .toBeVisible()
      .withTimeout(25000);
    await element(by.id('age-gate-confirm')).tap();
    await device.enableSynchronization();
  });

  beforeEach(async () => {
    await device.launchApp({newInstance: true});
    await device.disableSynchronization();
  });

  afterEach(async () => {
    await device.enableSynchronization();
  });

  it('goes from the splash straight to the home screen', async () => {
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await detoxExpect(element(by.id('splash-screen'))).not.toExist();
    await detoxExpect(element(by.id('age-gate-modal'))).not.toExist();
    await detoxExpect(element(by.text('Welcome to LuminXn'))).toBeVisible();
  });

  it('plays the splash again on every cold start', async () => {
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await device.launchApp({newInstance: true});
    await device.disableSynchronization();

    await waitFor(element(by.id('splash-screen')))
      .toBeVisible()
      .withTimeout(15000);
  });

  it('keeps the home screen when the app goes to the background and back', async () => {
    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(20000);

    await device.sendToHome();
    await device.launchApp({newInstance: false});

    await waitFor(element(by.id('home-screen')))
      .toBeVisible()
      .withTimeout(10000);
    await detoxExpect(element(by.id('splash-screen'))).not.toExist();
    await detoxExpect(element(by.id('age-gate-modal'))).not.toExist();
  });
});
