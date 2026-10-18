// seed-state.js
// What a device starts with the first time (and after "Reset all test data"):
// the sample jobs, the Thabang test account, and two earlier applications.

import { DAY, DEFAULT_PIN, MIN, TEST_EMAIL, TEST_PASS } from '../config.js';
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
      minPay: 8000,
    },
    cv: { name: 'Thabang_Jameson_CV.pdf', size: 182000, at: now - 3 * DAY, sample: true },
    auto: { mode: 'auto', min: 75, paused: false },
    lastSeen: now,
    photo: null,
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

// Make sure the test account always exists, even on an older saved copy.
export function ensureTestAccount(state) {
  if (!state.users[TEST_EMAIL]) state.users[TEST_EMAIL] = createSeedState().users[TEST_EMAIL];
}
