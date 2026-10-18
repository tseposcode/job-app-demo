// account.js
// POPIA-related account rules: recording consent, marketing opt-in,
// downloading your data, and deleting your account.
//
// POPIA puts the burden of proof on us (s11(2)(a)), so every consent decision
// is stored with the notice version and the time, in user.consentLog.

import { PRIVACY_VERSION, TEST_EMAIL } from '../config.js';
import { getState, save } from '../core/store.js';
import { deleteCv } from '../core/files.js';
import { createSeedState } from '../data/seed-state.js';
import { currentUser } from './auth.js';
import { statusOf } from './applications.js';

function log(u, what) {
  u.consentLog = u.consentLog || [];
  u.consentLog.push({ at: Date.now(), version: PRIVACY_VERSION, what });
}

export function giveConsent({ marketing }) {
  const u = currentUser();
  if (!u) return;
  u.consent = {
    version: PRIVACY_VERSION,
    at: Date.now(),
    processing: true,
    sharing: true,
    adult: true,
    marketing: !!marketing,
    how: 'Ticked the boxes on the privacy step of sign-up',
  };
  log(u, `Agreed to privacy notice v${PRIVACY_VERSION}${marketing ? ' and to marketing emails' : ''}`);
  save();
}

export function setMarketing(on) {
  const u = currentUser();
  if (!u || !u.consent) return;
  u.consent.marketing = !!on;
  log(u, on ? 'Opted in to marketing emails' : 'Opted out of marketing emails');
  save();
}

// Everything we hold about the person, as plain data they can download.
export function exportMyData() {
  const u = currentUser();
  if (!u) return null;
  const { pass: _pass, setup: _setup, ...profile } = u;
  const s = getState();
  const applications = s.apps
    .filter((a) => a.email === u.email)
    .map((a) => {
      const job = s.jobs.find((j) => j.id === a.jobId);
      return {
        job: job ? job.title : a.jobTitle,
        company: job ? job.company : a.company,
        how: a.method === 'auto' ? 'Auto-apply' : 'One-tap',
        sentAt: new Date(a.at).toISOString(),
        status: statusOf(a).label,
      };
    });
  return {
    about: 'Everything Job Auto holds about you on this device (test version).',
    exportedAt: new Date().toISOString(),
    profile,
    applications,
  };
}

// Delete the account, its applications and its CV file. Used for
// "withdraw consent and delete" and for declining consent at sign-up.
export function deleteAccount() {
  const u = currentUser();
  if (!u) return;
  const s = getState();
  const email = u.email;
  deleteCv(email);
  s.apps = s.apps.filter((a) => a.email !== email);
  delete s.users[email];
  s.session = null;
  // The shared demo login must keep working, so a fresh test account comes back.
  if (email === TEST_EMAIL) s.users[TEST_EMAIL] = createSeedState().users[TEST_EMAIL];
  save();
}
