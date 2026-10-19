// seed-state.js
// What a device starts with the first time (and after "Reset all test data"):
// the sample jobs, the Thabang test account (already signed up, consented and
// subscribed), and two earlier applications.

import { DAY, DEFAULT_PIN, MIN, PLANS, PRIVACY_VERSION, TEST_EMAIL, TEST_PASS } from '../config.js';
import { hashPass } from '../lib/utils.js';
import { makeApplication } from '../services/applications.js';
import { SEED_JOBS } from './seed-jobs.js';

export function createSeedState() {
  const now = Date.now();
  const s = {
    version: 1,
    pin: DEFAULT_PIN,
    session: null,
    jobs: structuredClone(SEED_JOBS),
    users: {},
    apps: [],
  };
  s.users[TEST_EMAIL] = {
    email: TEST_EMAIL,
    pass: hashPass(TEST_PASS),
    created: now,
    name: 'Thabang',
    surname: 'Jameson',
    phone: '071 000 4821',
    city: 'Kempton Park',
    province: 'Gauteng',
    qual: 'Degree',
    study: 'BCom Supply Chain Management',
    institution: 'University of Johannesburg',
    gradYear: '2025',
    skills: ['Excel', 'Power BI', 'Procurement', 'SAP', 'Communication', 'Process mapping'],
    experience: 'Six-month admin internship at a logistics company. Volunteer maths tutor.',
    prefs: {
      fields: ['Supply chain', 'Data and analytics', 'Finance and accounting'],
      types: ['Graduate programme', 'Internship', 'Entry-level job'],
      provinces: ['Gauteng'],
      remote: true,
      relocate: false,
      minPay: 8000,
    },
    cv: { name: 'Thabang_Jameson_CV.pdf', size: 182000, at: now - 3 * DAY, sample: true },
    auto: { mode: 'auto', min: 75, paused: false },
    lastSeen: now,
    photo: null,
    ...testAccountSignup(now),
  };
  // Two earlier applications so the Applied page is not empty on first open.
  s.apps.push(
    makeApplication(s, 'j09', TEST_EMAIL, 'one-tap', now - 2 * DAY, {
      viewAfter: 3 * 60 * MIN,
      decideAfter: 20 * 60 * MIN,
      outcome: 'interview',
    }),
  );
  s.apps.push(
    makeApplication(s, 'j12', TEST_EMAIL, 'auto', now - 50 * MIN, {
      viewAfter: 20 * MIN,
      decideAfter: 56 * MIN,
      outcome: 'rejected',
    }),
  );
  return s;
}

// The sign-up records the test account needs so it skips straight to Jobs.
function testAccountSignup(now) {
  const plan = PLANS[0];
  const started = now - 3 * DAY;
  const renews = new Date(started);
  renews.setMonth(renews.getMonth() + plan.months);
  return {
    onboarded: true,
    consent: {
      version: PRIVACY_VERSION,
      at: started,
      processing: true,
      sharing: true,
      adult: true,
      marketing: false,
      how: 'Test account, set up with the demo data',
    },
    consentLog: [{ at: started, version: PRIVACY_VERSION, what: `Agreed to privacy notice v${PRIVACY_VERSION}` }],
    subscription: {
      plan: plan.id,
      price: plan.price,
      status: 'active',
      startedAt: started,
      renewsAt: renews.getTime(),
      ref: 'TEST-0001',
      payments: [{ at: started, amount: plan.price, ref: 'TEST-0001', test: true }],
    },
  };
}

// Make sure the test account always exists and can log straight in, and bring
// accounts saved by older versions (before sign-up steps) up to date.
export function ensureTestAccount(state) {
  const test = state.users[TEST_EMAIL];
  if (!test) state.users[TEST_EMAIL] = createSeedState().users[TEST_EMAIL];
  else if (!test.subscription || !test.consent) Object.assign(test, testAccountSignup(Date.now()));
  else if (test.consent.version !== PRIVACY_VERSION) {
    // The test account is made up, so it agrees to a new notice automatically; real accounts are asked.
    const at = Date.now();
    test.consent = { ...test.consent, version: PRIVACY_VERSION, at };
    test.consentLog = [...(test.consentLog || []), { at, version: PRIVACY_VERSION, what: 'Demo test account: updated notice accepted automatically' }];
  }
  Object.values(state.users).forEach((u) => {
    if (u.onboarded === undefined) u.onboarded = !!u.cv;
  });
}
