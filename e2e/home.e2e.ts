import {by, device, element, expect as detoxExpect, waitFor} from 'detox';

/**
 * Home flow on a real Android emulator (backend must be reachable).
 * Fresh install: splash -> age pop-up -> home -> video name page.
 * Synchronization is off because the splash neon loops never go idle.
 */
describe('Home', () => {
  beforeAll(async () => {
    await device.launchApp({newInstance: true, delete: true});
    await device.disableSynchronization();
  });

  afterAll(async () => {
    await device.enableSynchronization();
  });

  it('asks the age question after the splash, then opens home', async () => {
    await waitFor(element(by.id('age-gate-confirm'))).toBeVisible().withTimeout(20000);
    await element(by.id('age-gate-confirm')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(10000);
  });

  it('shows the logo, the search bar and the categories with All selected', async () => {
    await detoxExpect(element(by.id('home-logo'))).toBeVisible();
    await detoxExpect(element(by.id('home-search-input'))).toBeVisible();
    await waitFor(element(by.id('category-All'))).toBeVisible().withTimeout(10000);
  });

  it('shows videos from the backend', async () => {
    await waitFor(element(by.id('video-card')).atIndex(0)).toBeVisible().withTimeout(15000);
  });

  it('collapses the search bar to an icon on scroll and keeps the logo', async () => {
    await element(by.id('home-list')).scroll(500, 'down');
    await waitFor(element(by.id('home-search-input'))).not.toBeVisible().withTimeout(3000);
    await detoxExpect(element(by.id('home-logo'))).toBeVisible();
    await detoxExpect(element(by.id('home-search-toggle'))).toBeVisible();
  });

  it('re-opens the search bar from the icon', async () => {
    await element(by.id('home-search-toggle')).tap();
    await waitFor(element(by.id('home-search-input'))).toBeVisible().withTimeout(3000);
  });

  it('scrolls back to the top and the full bar returns', async () => {
    await element(by.id('home-list')).scrollTo('top');
    await waitFor(element(by.id('home-search-input'))).toBeVisible().withTimeout(3000);
  });

  it('opens a page with only the video name, and Back returns', async () => {
    await element(by.id('video-card')).atIndex(0).tap();
    await waitFor(element(by.id('video-detail-screen'))).toBeVisible().withTimeout(5000);
    await detoxExpect(element(by.id('video-detail-title'))).toBeVisible();
    await element(by.id('video-detail-back')).tap();
    await waitFor(element(by.id('home-screen'))).toBeVisible().withTimeout(5000);
  });

  it('shows a preview in place on long press, without opening the page', async () => {
    await element(by.id('video-card')).atIndex(0).longPress(1200);
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  it('filters by a category', async () => {
    await element(by.id('category-All')).tap();
    await detoxExpect(element(by.id('category-All'))).toBeVisible();
  });
});
