// app.spec.js
// End-to-end checks of the main flows. Run before every pull request: npm test
import { test, expect } from '@playwright/test';

async function loginAsTest(page) {
  await page.goto('/index.html');
  await page.click('#fillTest');
  await page.click('#loginForm button[type=submit]');
  await expect(page.locator('#q')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  // Start every test with an empty browser store.
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
});

test('wrong password is rejected', async ({ page }) => {
  await page.goto('/index.html');
  await page.fill('#liEmail', 'thabang@test.com');
  await page.fill('#liPass', 'wrong');
  await page.click('#loginForm button[type=submit]');
  await expect(page.locator('#liErr')).toContainText('do not match');
});

test('test account logs in and auto-apply runs', async ({ page }) => {
  await loginAsTest(page);
  await expect(page.locator('#view')).toContainText('Hi Thabang');
  await expect(page.locator('#toast')).toContainText('Auto-apply sent your CV');
  await expect(page.locator('.jobs > li')).toHaveCount(20);
});

test('search and province filter narrow the list', async ({ page }) => {
  await loginAsTest(page);
  await page.fill('#q', 'data');
  const n = await page.locator('.jobs > li').count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(20);
  await page.locator('[data-clear]').first().click();
  await page.selectOption('#fProv', 'Western Cape');
  await expect(page.locator('.jobs > li')).toHaveCount(2);
});

test('one-tap apply and withdraw', async ({ page }) => {
  await loginAsTest(page);
  await page.click('.tab[data-go=profile]');
  await page.click('[data-mode=one]');
  await page.click('.tab[data-go=jobs]');
  const before = await page.locator('[data-apply]').count();
  await page.locator('[data-apply]').first().click();
  await expect(page.locator('[data-apply]')).toHaveCount(before - 1);
  await page.click('.tab[data-go=applied]');
  await page.locator('.jobs > li .job-open').first().click();
  await page.click('#wd');
  await page.click('[data-yes]');
  await expect(page.locator('#view')).toContainText('Withdrawn');
});

test('statuses move on over time', async ({ page }) => {
  await loginAsTest(page);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('jobauto:v1'));
    s.apps.forEach((a) => (a.at -= 10 * 60 * 1000));
    localStorage.setItem('jobauto:v1', JSON.stringify(s));
  });
  await page.reload();
  await page.click('.tab[data-go=applied]');
  const states = await page.locator('.jobs > li .state').allInnerTexts();
  expect(states.some((s) => s === 'Sent' || s === 'Viewed')).toBe(false);
});

test('admin PIN, add and delete a job', async ({ page }) => {
  await page.goto('/index.html#admin');
  const digits = page.locator('.pinD');
  for (let i = 0; i < 4; i++) await digits.nth(i).fill('2468'[i]);
  await expect(page.locator('#addJob')).toBeVisible();
  await page.click('#addJob');
  await page.fill('#jTitle', 'Test Job QA');
  await page.fill('#jCompany', 'QA Co');
  await page.fill('#jCity', 'Soweto');
  await page.fill('#jPay', '9000');
  await page.fill('#jCloses', '2026-12-31');
  await page.click('#jForm button[type=submit]');
  await expect(page.locator('#view')).toContainText('Test Job QA');
  await page.locator('[data-del]').first().click();
  await page.click('[data-yes]');
  await expect(page.locator('#view')).not.toContainText('Test Job QA');
});

test('new account is asked to finish the profile', async ({ page }) => {
  await page.goto('/index.html#signup');
  await page.fill('#suName', 'Lerato');
  await page.fill('#suSurname', 'Mokoena');
  await page.fill('#suEmail', 'lerato@test.com');
  await page.fill('#suPass', 'abc123');
  await page.click('#signupForm button[type=submit]');
  await expect(page.locator('#view')).toContainText('Lerato Mokoena');
  await page.click('.tab[data-go=jobs]');
  await expect(page.locator('#view')).toContainText('Finish your profile');
});

test('no sideways scrolling on a phone', async ({ page }) => {
  await loginAsTest(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
