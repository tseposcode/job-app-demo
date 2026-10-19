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
  await expect(page.locator('.sheet')).toContainText('Total due today');
  await expect(page.locator('.sheet')).toContainText('Test mode');
  await expect(page.locator('.wallet')).toHaveCount(3);
  await page.click('#ccTest');
  await page.click('#coPay');
  await expect(page.locator('.sheet')).toContainText('Payment successful');
  await expect(page.locator('.sheet')).toContainText('Visa •••• 4242');
  await page.click('#coDone');
  await expect(page.locator('#toast')).toContainText('Auto-apply sent your CV to');
  await expect(page.locator('#view')).toContainText('Hi Lerato');
  await page.click('.tab[data-go=applied]');
  expect(await page.locator('.jobs > li').count()).toBeGreaterThan(2);
  // The consent record is kept.
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#view')).toContainText('to notice version 1.3');
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

// iPhone Safari can't read a file again after it has been saved in IndexedDB.
// This copies that behaviour: once a file is saved, reading it fails.
async function actLikeIphoneSafari(page) {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, key) {
      if (value instanceof Blob) {
        const fail = () => Promise.reject(new DOMException('WebKitBlobResource error 1', 'NotReadableError'));
        value.arrayBuffer = fail;
        value.text = fail;
      }
      return put.call(this, value, key);
    };
  });
  await page.reload(); // the patch only applies to a freshly loaded page
}

// Safari can't loop over a ReadableStream with `for await`. Remove that from Chrome
// to check PDFs are still read.
test('iPhone Safari: PDF CVs are read without stream looping', async ({ page }) => {
  await page.addInitScript(() => {
    delete ReadableStream.prototype[Symbol.asyncIterator];
    delete ReadableStream.prototype.values;
  });
  await page.reload();
  await signUp(page, 'Test', 'Person', 'safaripdf@test.com');
  await agreeToPrivacy(page);
  await page.click('[data-sample="0"]');
  await expect(page.locator('#view')).toContainText('We read your CV');
  await expect(page.locator('#pCity')).toHaveValue('Johannesburg');
});

for (const [i, file] of [
  [0, 'a PDF'],
  [5, 'a Word'],
]) {
  test(`iPhone Safari: ${file} sample CV is read, and a second CV after it`, async ({ page }) => {
    await actLikeIphoneSafari(page);
    await signUp(page, 'Test', 'Person', `safari${i}@test.com`);
    await agreeToPrivacy(page);
    await page.click(`[data-sample="${i}"]`);
    await expect(page.locator('#view')).toContainText('We read your CV');
    // Go back and pick another CV, as the tester did after the first one worked.
    await page.click('#back');
    await page.click('[data-sample="3"]');
    await expect(page.locator('#view')).toContainText('We read your CV');
    await expect(page.locator('#pCity')).toHaveValue('Pretoria');
  });
}

test('Gentle-TT logo on Log in, Create an account and Profile', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.brandmark')).toBeVisible();
  await page.goto('/index.html#signup');
  await expect(page.locator('.brandmark')).toBeVisible();
  await loginAsTest(page);
  await page.goto('/index.html#profile');
  await expect(page.locator('.madeby .brandmark')).toBeVisible();
  // The logo image itself loads.
  const res = await page.request.get('/img/gentle-tt.png');
  expect(res.ok()).toBe(true);
});

test('briefcase logo in the header and the company on Profile', async ({ page }) => {
  await loginAsTest(page);
  await expect(page.locator('.wordmark svg.logo')).toBeVisible();
  await expect(page.locator('.wordmark i')).toHaveCount(0); // the old checkmark is gone
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#madeBy')).toHaveText('Job Auto is a product of Gentle-TT (Pty) Ltd.');
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
  await expect(page.locator('#view')).toContainText('a product of Gentle-TT (Pty) Ltd');
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

// ---------- Checkout ----------

async function toCheckout(page, email, plan) {
  await signUp(page, 'Pay', 'Tester', email);
  await agreeToPrivacy(page);
  await page.click('[data-sample="0"]');
  await page.click('#dForm button[type=submit]');
  await page.click('#prefForm button[type=submit]');
  await expect(page.locator('h1')).toHaveText('Choose your plan');
  if (plan) await page.click(`[data-plan=${plan}]`);
  await page.click('#toPay');
  await expect(page.locator('.sheet')).toContainText('Total due today');
}

async function fillCard(page, number, expiry = '12 / 30', cvc = '123') {
  await page.fill('#ccNum', number);
  await page.fill('#ccExp', expiry);
  await page.fill('#ccCvc', cvc);
  await page.fill('#ccName', 'Pay Tester');
}

test('checkout: a real card is refused in test mode and nothing is kept', async ({ page }) => {
  await toCheckout(page, 'realcard@test.com');
  await fillCard(page, '5105 1051 0510 5100');
  await expect(page.locator('#ccBrand')).toHaveText('Mastercard');
  await page.click('#coPay');
  await expect(page.locator('#coErr')).toContainText('real cards are never charged');
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  expect(stored).not.toContain('5105');
});

test('checkout: card checks and a declined card', async ({ page }) => {
  await toCheckout(page, 'declined@test.com');
  await fillCard(page, '4242 4242 4242 4241');
  await page.click('#coPay');
  await expect(page.locator('#coErr')).toContainText('Check your card number');
  await fillCard(page, '4242 4242 4242 4242', '01 / 20');
  await page.click('#coPay');
  await expect(page.locator('#coErr')).toContainText('expired');
  await fillCard(page, '4000 0000 0000 0002');
  await page.click('#coPay');
  await expect(page.locator('#coErr')).toContainText('declined');
  await expect(page.locator('h1')).toHaveText('Choose your plan');
});

test('checkout: approve in the banking app (3-D Secure)', async ({ page }) => {
  await toCheckout(page, 'threeds@test.com');
  await fillCard(page, '4000 0027 6000 3184');
  await page.click('#coPay');
  await expect(page.locator('.sheet')).toContainText('Approve the payment in your banking app');
  await page.click('#apYes');
  await expect(page.locator('.sheet')).toContainText('Payment successful');
});

test('checkout: Apple Pay', async ({ page }) => {
  await toCheckout(page, 'applepay@test.com');
  await page.click('[data-wallet=apple_pay]');
  await expect(page.locator('.sheet')).toContainText('Confirm with Face ID');
  await page.click('#wPay');
  await expect(page.locator('.sheet')).toContainText('Payment successful');
  await expect(page.locator('.sheet')).toContainText('Apple Pay (Visa •••• 0019)');
  await page.click('#coDone');
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#view')).toContainText('Apple Pay (Visa •••• 0019)');
});

test('checkout: Samsung Pay and Google Pay are offered', async ({ page }) => {
  await toCheckout(page, 'wallets@test.com');
  await expect(page.locator('[data-wallet=samsung_pay]')).toHaveText('Samsung Pay');
  await page.click('[data-wallet=google_pay]');
  await page.click('#wPay');
  await expect(page.locator('.sheet')).toContainText('Google Pay');
});

test('checkout: Instant EFT pays once and the plan does not renew by itself', async ({ page }) => {
  await toCheckout(page, 'eft@test.com');
  await page.click('[data-tab=eft]');
  await expect(page.locator('#coForm')).toContainText('does not renew by itself');
  await page.click('#coPay');
  await expect(page.locator('#coErr')).toContainText('Choose your bank');
  await page.selectOption('#eftBank', 'Capitec');
  await page.click('#coPay');
  await expect(page.locator('.sheet')).toContainText('Payment successful');
  await page.click('#coDone');
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#view')).toContainText('Instant EFT · Capitec');
  await expect(page.locator('#view')).toContainText('Plan ends');
});

test('Profile: payment method, billing history and changing the card', async ({ page }) => {
  await loginAsTest(page);
  await page.click('.tab[data-go=profile]');
  await expect(page.locator('#view')).toContainText('Visa •••• 4242');
  await expect(page.locator('.bills .bill')).toHaveCount(1);
  await page.click('#chCard');
  await fillCard(page, '5555 5555 5555 4444', '08 / 29');
  await page.click('#ccForm button[type=submit]');
  await expect(page.locator('#toast')).toContainText('Mastercard •••• 4444 will be used');
  await expect(page.locator('#view')).toContainText('Mastercard •••• 4444');
  await expect(page.locator('#view')).toContainText('expires 08 / 29');
});

// ---------- Launch-ready features ----------

async function unlockAdmin(page) {
  await page.goto('/index.html#admin');
  for (let i = 0; i < 4; i++) await page.locator('.pinD').nth(i).fill('2468'[i]);
  await expect(page.locator('#addJob')).toBeVisible();
}

test('jobs: apply on the company site, and auto-apply skips those jobs', async ({ page }) => {
  await loginAsTest(page);
  const autoOnSite = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('jobauto:v1'));
    return s.apps.filter((a) => a.method === 'auto' && ['j05', 'j08', 'j14', 'j18'].includes(a.jobId)).length;
  });
  expect(autoOnSite).toBe(0);
  await page.locator('.job-open[data-job=j05]').click();
  await expect(page.locator('.sheet')).toContainText("On the company's website");
  await page.click('#siteOpen');
  await expect(page.locator('#toast')).toContainText('made up');
  await page.click('#siteDone');
  await expect(page.locator('#toast')).toContainText('on their website');
  await page.click('.tab[data-go=applied]');
  await expect(page.locator('#view')).toContainText('Applied on site');
});

test('employer view: cover note and email for an application', async ({ page }) => {
  await loginAsTest(page);
  await page.click('.tab[data-go=applied]');
  await page.locator('[data-job=j09]').click();
  await expect(page.locator('.sheet')).toContainText('By email');
  await page.click('#empView');
  await expect(page.locator('.sheet')).toContainText('Dear Sable Financial hiring team');
  await expect(page.locator('.sheet')).toContainText('careers@sable-financial.example');
  await expect(page.locator('.sheet')).toContainText('Thabang_Jameson_CV.pdf');
});

test('forgot password: reset link, new password, log in', async ({ page }) => {
  await page.goto('/index.html');
  await page.click('.forgot');
  await page.fill('#fgEmail', 'nobody@test.com');
  await page.click('#fgForm button[type=submit]');
  await expect(page.locator('h1')).toHaveText('Check your email');
  await expect(page.locator('#openReset')).toHaveCount(0);
  await page.click('#backLogin');
  await page.click('.forgot');
  await page.fill('#fgEmail', 'thabang@test.com');
  await page.click('#fgForm button[type=submit]');
  await page.click('#openReset');
  await page.fill('#rsPass', 'newpass1');
  await page.fill('#rsPass2', 'newpass2');
  await page.click('#rsForm button[type=submit]');
  await expect(page.locator('#rsErr')).toContainText('not the same');
  await page.fill('#rsPass2', 'newpass1');
  await page.click('#rsForm button[type=submit]');
  await expect(page.locator('#toast')).toContainText('Password changed');
  await page.fill('#liEmail', 'thabang@test.com');
  await page.fill('#liPass', 'newpass1');
  await page.click('#loginForm button[type=submit]');
  await expect(page.locator('#view')).toContainText('Hi Thabang');
});

test('inbox: confirm email, receipt and application emails', async ({ page }) => {
  await toCheckout(page, 'inbox@test.com');
  await page.click('#ccTest');
  await page.click('#coPay');
  await page.click('#coDone');
  await expect(page.locator('#view')).toContainText('Confirm your email address');
  await expect(page.locator('#bellN')).toBeVisible();
  await page.click('#bell');
  await expect(page.locator('h1')).toHaveText('Inbox');
  await expect(page.locator('#view')).toContainText('Your Job Auto receipt');
  await expect(page.locator('#view')).toContainText('Auto-apply sent your CV');
  await page.locator('.mail', { hasText: 'Confirm your email address' }).click();
  await page.click('#mailAct');
  await expect(page.locator('#toast')).toContainText('email is confirmed');
  await page.click('.tab[data-go=jobs]');
  await expect(page.locator('#view')).not.toContainText('Confirm your email address');
});

test('inbox: the test account gets employer replies by email', async ({ page }) => {
  await loginAsTest(page);
  await page.click('#bell');
  await expect(page.locator('#view')).toContainText('Interview invitation: Finance Graduate Programme');
});

test('help: questions, contact and a message the admin sees', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('[data-go=help]').first().click();
  await expect(page.locator('h1')).toHaveText('Help and contact');
  await page.locator('summary', { hasText: 'How do I cancel?' }).click();
  await expect(page.locator('#view')).toContainText('Profile → Plan → Cancel plan');
  await page.fill('#hpName', 'Pat');
  await page.fill('#hpEmail', 'pat@test.com');
  await page.fill('#hpMsg', 'How do refunds work for a yearly plan?');
  await page.click('#hpForm button[type=submit]');
  await expect(page.locator('#view')).toContainText('Message sent');
  await unlockAdmin(page);
  await expect(page.locator('#view')).toContainText('How do refunds work for a yearly plan?');
});

test('terms: on sign-up and in checkout', async ({ page }) => {
  await page.goto('/index.html#signup');
  await page.click('#suTerms');
  await expect(page.locator('.sheet')).toContainText('Terms of Service');
  await page.click('.sheet [data-close] >> nth=0');
  await toCheckout(page, 'terms@test.com');
  await page.click('#coRefunds');
  await expect(page.locator('.sheet')).toContainText('Changed your mind? 7 days');
  await page.click('#legalBack');
  await expect(page.locator('.sheet')).toContainText('Total due today');
});

test('billing: test clock renews a plan, a failed renewal is fixed with a new card', async ({ page }) => {
  await toCheckout(page, 'renew@test.com', 'monthly');
  await fillCard(page, '4000 0000 0000 0341');
  await page.click('#coPay');
  await page.click('#coDone');
  await unlockAdmin(page);
  await expect(page.locator('#view')).toContainText('Business');
  await page.click('[data-jump="30"]');
  await expect(page.locator('#toast')).toContainText('Renewed 1');
  await page.click('[data-jump="1"]');
  await page.click('[data-jump="1"]');
  await expect(page.locator('#topPill')).toContainText('Admin');
  await page.goto('/index.html#profile');
  await expect(page.locator('#topPill')).toContainText('Test ·');
  await expect(page.locator('#view')).toContainText("Your last payment didn't go through");
  await page.click('#chCard');
  await page.click('#ccTest');
  await page.click('#ccForm button[type=submit]');
  await expect(page.locator('#toast')).toContainText('Payment received');
  await expect(page.locator('#view')).not.toContainText("didn't go through");
  await expect(page.locator('.bills .bill')).toHaveCount(2);
});

test('billing: Instant EFT plan ends when its period is over', async ({ page }) => {
  await toCheckout(page, 'eftend@test.com', 'monthly');
  await page.click('[data-tab=eft]');
  await page.selectOption('#eftBank', 'FNB');
  await page.click('#coPay');
  await page.click('#coDone');
  await unlockAdmin(page);
  await page.click('[data-jump="30"]');
  await page.click('[data-jump="7"]');
  await page.goto('/index.html#jobs');
  await expect(page.locator('h1')).toHaveText('Your plan has ended');
});

test('admin: refund ends the plan and emails the customer', async ({ page }) => {
  await loginAsTest(page);
  await unlockAdmin(page);
  await page.click('[data-refund="TEST-0001"]');
  await page.click('[data-yes]');
  await expect(page.locator('#toast')).toContainText('Refunded');
  await expect(page.locator('#view')).toContainText('Refunded');
  await page.goto('/index.html#jobs');
  await expect(page.locator('h1')).toHaveText('Your plan has ended');
});

test('cancel and keep the plan', async ({ page }) => {
  await loginAsTest(page);
  await page.click('.tab[data-go=profile]');
  await page.click('#subCancel');
  await page.click('[data-yes]');
  await expect(page.locator('#view')).toContainText('Ends');
  await page.click('#subResume');
  await expect(page.locator('#view')).toContainText('Next payment');
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
