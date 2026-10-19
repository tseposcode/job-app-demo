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

async function signUp(page, name, surname, email) {
  await page.goto('/index.html#signup');
  await page.fill('#suName', name);
  await page.fill('#suSurname', surname);
  await page.fill('#suEmail', email);
  await page.fill('#suPass', 'abc123');
  await page.click('#signupForm button[type=submit]');
  await expect(page.locator('h1')).toHaveText('Your privacy');
}

async function agreeToPrivacy(page) {
  await page.check('#cProcess');
  await page.check('#cShare');
  await page.check('#cAdult');
  await page.click('#consentForm button[type=submit]');
  await expect(page.locator('h1')).toHaveText('Add your CV');
}

test('privacy step needs the required boxes, and declining deletes the account', async ({ page }) => {
  await signUp(page, 'Test', 'Person', 'decline@test.com');
  // Nothing is ticked for the person.
  expect(await page.locator('#consentForm input:checked').count()).toBe(0);
  await page.click('#consentForm button[type=submit]');
  await expect(page.locator('#cErr')).toContainText('three required boxes');
  // The app cannot be used before agreeing.
  await page.goto('/index.html#jobs');
  await expect(page.locator('h1')).toHaveText('Your privacy');
  await page.click('#cDecline');
  await page.click('[data-yes]');
  await expect(page.locator('#loginForm')).toBeVisible();
  await page.fill('#liEmail', 'decline@test.com');
  await page.fill('#liPass', 'abc123');
  await page.click('#loginForm button[type=submit]');
  await expect(page.locator('#liErr')).toBeVisible();
});

test('full sign-up with a sample CV: consent, CV read, plan, auto-apply', async ({ page }) => {
  await signUp(page, 'Lerato', 'Mokoena', 'lerato@test.com');
  await agreeToPrivacy(page);
  await page.click('[data-sample="0"]');
  // The CV reader fills in the profile.
  await expect(page.locator('h1')).toHaveText('Check your details');
  await expect(page.locator('#view')).toContainText('We read your CV');
  await expect(page.locator('#pCity')).toHaveValue('Johannesburg');
  await expect(page.locator('#pProv')).toHaveValue('Gauteng');
  await expect(page.locator('#pQual')).toHaveValue('Degree');
  await expect(page.locator('#pSkills')).toHaveValue(/Python, SQL/);
  await page.click('#dForm button[type=submit]');
  await expect(page.locator('h1')).toHaveText('What jobs do you want?');
  await expect(page.locator('input[name=pf][value="Data and analytics"]')).toBeChecked();
  await expect(page.locator('#pRemote')).toBeChecked();
  await page.click('#prefForm button[type=submit]');
  // Paywall: matches are shown but nothing is sent until there is a plan.
  await expect(page.locator('h1')).toHaveText('Choose your plan');
  await expect(page.locator('#view')).toContainText('jobs match you right now');
  await expect(page.locator('.plan')).toHaveCount(3);
  await expect(page.locator('.plan .best')).toHaveCount(1);
  await page.goto('/index.html#jobs');
  await expect(page.locator('h1')).toHaveText('Choose your plan');
  await page.click('[data-plan=monthly]');
  await page.click('#toPay');
  await expect(page.locator('.sheet')).toContainText('Test mode');
  expect(await page.locator('.sheet input').count()).toBe(0); // no card fields
  await page.click('#payTest');
  await expect(page.locator('#toast')).toContainText('Auto-apply sent your CV to');
  await expect(page.locator('#view')).toContainText('Hi Lerato');
  await page.click('.tab[data-go=applied]');
  expect(await page.locator('.jobs > li').count()).toBeGreaterThan(2);
  // The consent record is kept.
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#view')).toContainText('to notice version 1.1');
});

test('uploading a PDF CV reads it', async ({ page }) => {
  await signUp(page, 'Sipho', 'Ndlovu', 'sipho@test.com');
  await agreeToPrivacy(page);
  await page.setInputFiles('#setupCv', 'samples/cvs/Sipho_Ndlovu_CV.pdf');
  await expect(page.locator('#pCity')).toHaveValue('Durban');
  await expect(page.locator('#pQual')).toHaveValue('Diploma');
  await expect(page.locator('#pPhone')).toHaveValue('072 000 5678');
});

test('willing to relocate adds good jobs outside your provinces', async ({ page }) => {
  await loginAsTest(page);
  await expect(page.locator('#view')).toContainText('outside your provinces');
  await page.click('#relocateOn');
  await expect(page.locator('#toast')).toContainText('Auto-apply sent your CV to 2 new jobs');
  await expect(page.locator('#relocateOn')).toHaveCount(0);
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#relocSw')).toHaveAttribute('aria-checked', 'true');
  await page.click('#relocSw');
  await expect(page.locator('#relocSw')).toHaveAttribute('aria-checked', 'false');
});

test('a CV that says "ready to relocate" ticks the box', async ({ page }) => {
  await signUp(page, 'Sipho', 'Ndlovu', 'sipho2@test.com');
  await agreeToPrivacy(page);
  await page.click('[data-sample="1"]');
  await page.click('#dForm button[type=submit]');
  await expect(page.locator('#pRelocate')).toBeChecked();
});

// Real-world style CVs: no "Looking for" section, so preferences are suggested.
for (const [file, checks] of [
  ['Nomsa_Dlamini_CV.pdf', { pCity: 'Pretoria', pProv: 'Gauteng', pQual: 'Degree', pPhone: '082 000 4567', pYear: '2025', warn: 'ID number' }],
  ['Kabelo_Mahlangu_CV.pdf', { pCity: 'Polokwane', pProv: 'Limpopo', pQual: 'Degree', pPhone: '083 000 3579', pYear: '2025' }],
  ['Zanele_Khumalo_CV.docx', { pCity: 'Umlazi', pProv: 'KwaZulu-Natal', pQual: 'Diploma', pPhone: '076 000 8642', pYear: '2024', warn: 'health' }],
]) {
  test(`reads a real-world style CV: ${file}`, async ({ page }) => {
    await signUp(page, 'Test', 'Person', `${file.slice(0, 5).toLowerCase()}@test.com`);
    await agreeToPrivacy(page);
    await page.setInputFiles('#setupCv', `samples/cvs/${file}`);
    await expect(page.locator('h1')).toHaveText('Check your details');
    const { warn, ...fields } = checks;
    for (const [id, value] of Object.entries(fields)) await expect(page.locator(`#${id}`)).toHaveValue(value);
    if (warn) await expect(page.locator('#view')).toContainText(new RegExp(`Your CV shows.*${warn}`));
    await page.click('#dForm button[type=submit]');
    await expect(page.locator('#view')).toContainText('Suggested from your CV');
    expect(await page.locator('input[name=pf]:checked').count()).toBeGreaterThan(0);
    await page.click('#prefForm button[type=submit]');
    await expect(page.locator('h1')).toHaveText('Choose your plan');
  });
}

test('briefcase logo in the header and the company on Profile', async ({ page }) => {
  await loginAsTest(page);
  await expect(page.locator('.wordmark svg.logo')).toBeVisible();
  await expect(page.locator('.wordmark i')).toHaveCount(0); // the old checkmark is gone
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#madeBy')).toHaveText('Job Auto is a product of Gentle-TT Pty Ltd.');
});

test('a changed privacy notice asks real accounts to agree again', async ({ page }) => {
  await loginAsTest(page);
  // Copy the test account as a "real" account that agreed to an older notice.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('jobauto:v1'));
    const u = structuredClone(s.users['thabang@test.com']);
    u.email = 'older@test.com';
    u.consent.version = '1.0';
    s.users[u.email] = u;
    s.session = u.email;
    localStorage.setItem('jobauto:v1', JSON.stringify(s));
  });
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Our privacy notice has changed');
  await expect(page.locator('#view')).toContainText('a product of Gentle-TT Pty Ltd');
  await page.check('#cProcess');
  await page.check('#cShare');
  await page.check('#cAdult');
  await page.click('#consentForm button[type=submit]');
  await expect(page.locator('#q')).toBeVisible();
});

test('the test account accepts a new notice by itself', async ({ page }) => {
  await loginAsTest(page);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('jobauto:v1'));
    s.users['thabang@test.com'].consent.version = '1.0';
    localStorage.setItem('jobauto:v1', JSON.stringify(s));
  });
  await page.reload();
  await expect(page.locator('#view')).toContainText('Hi Thabang');
});

test('cancel and keep the plan', async ({ page }) => {
  await loginAsTest(page);
  await page.click('.tab[data-go=profile]');
  await page.click('#subCancel');
  await page.click('[data-yes]');
  await expect(page.locator('#view')).toContainText('Ends');
  await page.click('#subResume');
  await expect(page.locator('#view')).toContainText('Renews');
});

test('download my data, then delete the account', async ({ page }) => {
  await loginAsTest(page);
  await page.click('.tab[data-go=profile]');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#dlData')]);
  expect(download.suggestedFilename()).toBe('job-auto-my-data.json');
  const data = JSON.parse(await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString()));
  expect(data.profile.email).toBe('thabang@test.com');
  expect(data.profile.pass).toBeUndefined();
  await page.click('#delAcct');
  await page.click('[data-yes]');
  await expect(page.locator('#loginForm')).toBeVisible();
});

test('no sideways scrolling on a phone', async ({ page }) => {
  await loginAsTest(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
