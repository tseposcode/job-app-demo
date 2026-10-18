// auth.js
// Accounts on this device: log in, sign up, log out, and who is logged in.
// Demo only: accounts live in the browser. A real version needs a server.

import { getState, save } from '../core/store.js';
import { hashPass } from '../lib/utils.js';

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
  return { ok: true };
}

export function logout() {
  getState().session = null;
  save();
}

// A blank profile for a new account.
function newUser({ email, name, surname, password }) {
  return {
    email,
    pass: hashPass(password),
    created: Date.now(),
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
    prefs: { fields: [], types: [], provinces: [], remote: false, minPay: 0 },
    cv: null,
    auto: { mode: 'one', min: 75, paused: false },
    lastSeen: Date.now(),
    photo: null,
  };
}
