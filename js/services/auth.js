// auth.js
// Accounts on this device: log in, sign up, log out, and who is logged in.
// Demo only: accounts live in the browser. A real version needs a server.

import { DAY, MIN } from '../config.js';
import { getState, save } from '../core/store.js';
import { hashPass, uid } from '../lib/utils.js';
import { notify } from './notify.js';

const token = () => `${uid()}${uid()}${uid()}`;
const RESET_LIFE = 60 * MIN;
const VERIFY_LIFE = 3 * DAY;

export function currentUser() {
  const s = getState();
  return s.session ? s.users[s.session] || null : null;
}

export function login(email, password) {
  const s = getState();
  const key = String(email).trim().toLowerCase();
  if (!key || !password) return { ok: false, error: 'Enter your email and password.' };
  const user = s.users[key];
  if (!user || user.pass !== hashPass(password)) {
    return { ok: false, error: 'That email and password do not match an account on this device.' };
  }
  s.session = key;
  save();
  return { ok: true };
}

export function signup({ name, surname, email, password }) {
  const s = getState();
  const key = String(email).trim().toLowerCase();
  if (!name || !surname) return { ok: false, error: 'Add your name and surname.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(key)) return { ok: false, error: 'Enter a valid email address.' };
  if (!password || password.length < 6) return { ok: false, error: 'Use a password of at least 6 characters.' };
  if (s.users[key]) {
    return { ok: false, error: 'An account with that email already exists on this device. Log in instead.' };
  }
  s.users[key] = newUser({ email: key, name, surname, password });
  s.session = key;
  save();
  notify(key, {
    kind: 'welcome',
    subject: `Welcome to Job Auto, ${name}`,
    lines: [
      `Hi ${name},`,
      'Thanks for creating your Job Auto account. Finish the short sign-up steps and we will start matching you with graduate and entry-level jobs.',
      'If you did not create this account, reply to this email and we will remove it.',
    ],
  });
  sendVerification(s.users[key]);
  return { ok: true };
}

export function logout() {
  getState().session = null;
  save();
}

// ---------- Confirm email ----------

export function sendVerification(u) {
  u.verify = { token: token(), exp: Date.now() + VERIFY_LIFE };
  save();
  notify(u.email, {
    kind: 'verify',
    subject: 'Confirm your email address',
    lines: [
      `Hi ${u.name},`,
      'Please confirm this is your email address, so employers can reach you and you can reset your password if you forget it.',
      'The link works for 3 days.',
    ],
    action: { label: 'Confirm my email', kind: 'verify', token: u.verify.token },
  });
}

// Older accounts and the test account count as confirmed.
export const isVerified = (u) => !!u && u.emailVerified !== false;

export function verifyEmail(t) {
  const u = Object.values(getState().users).find((x) => x.verify && x.verify.token === t);
  if (!u) return { ok: false, error: 'That link is not valid any more. Ask for a new one from the Jobs page.' };
  if (Date.now() > u.verify.exp) return { ok: false, error: 'That link has expired. Ask for a new one from the Jobs page.' };
  u.emailVerified = true;
  delete u.verify;
  save();
  return { ok: true };
}

// ---------- Forgot password ----------

// Always answers the same way, so nobody can use this to find out who has an account.
// Returns the reset token too, only so the test version can show the link.
export function requestPasswordReset(email) {
  const s = getState();
  const key = String(email).trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(key)) return { ok: false, error: 'Enter the email address you signed up with.' };
  const u = s.users[key];
  if (!u) return { ok: true, token: null };
  const t = token();
  s.resets = s.resets || {};
  s.resets[t] = { email: key, exp: Date.now() + RESET_LIFE };
  save();
  notify(key, {
    kind: 'reset',
    subject: 'Reset your Job Auto password',
    lines: [
      `Hi ${u.name},`,
      'Someone asked to reset the password for your Job Auto account. If it was you, use the button below. The link works for 1 hour.',
      'If it was not you, you can ignore this email. Your password stays the same.',
    ],
    action: { label: 'Choose a new password', kind: 'reset', token: t },
  });
  return { ok: true, token: t };
}

export function resetPassword(t, password) {
  const s = getState();
  const r = s.resets && s.resets[t];
  if (!r || Date.now() > r.exp) return { ok: false, error: 'This reset link has expired or was already used. Ask for a new one.' };
  if (!password || password.length < 6) return { ok: false, error: 'Use a password of at least 6 characters.' };
  const u = s.users[r.email];
  if (!u) return { ok: false, error: 'This account no longer exists.' };
  u.pass = hashPass(password);
  delete s.resets[t];
  save();
  notify(u.email, {
    kind: 'security',
    subject: 'Your password was changed',
    lines: [`Hi ${u.name},`, 'The password for your Job Auto account was just changed.', 'If you did not do this, contact support straight away.'],
  });
  return { ok: true, email: u.email };
}

// A blank profile for a new account.
function newUser({ email, name, surname, password }) {
  return {
    email,
    pass: hashPass(password),
    created: Date.now(),
    emailVerified: false,
    name,
    surname,
    phone: '',
    city: '',
    province: '',
    qual: '',
    study: '',
    institution: '',
    gradYear: '',
    skills: [],
    experience: '',
    prefs: { fields: [], types: [], provinces: [], remote: false, relocate: false, minPay: 0 },
    cv: null,
    auto: { mode: 'one', min: 75, paused: false },
    lastSeen: Date.now(),
    photo: null,
  };
}
