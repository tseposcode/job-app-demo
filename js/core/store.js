// store.js
// The single place that holds the app's data and saves it in the browser.
// Every other file reads data through getState() and calls save() after a change.
//
// Shape of the data:
//   { version, pin, session, jobs: [...], users: { email: user }, apps: [...] }

import { STORAGE_KEY } from '../config.js';

let state = null;

function readFromBrowser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // private window, blocked storage or broken data: start fresh
  }
}

// Load saved data, or create it with createSeed() the first time.
export function initStore(createSeed) {
  state = readFromBrowser() || createSeed();
  save();
  return state;
}

export function getState() {
  if (!state) throw new Error('store.js: call initStore() before getState()');
  return state;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the app keeps working for this visit only.
  }
}

// Replace everything, for example when the admin resets the test data.
export function replaceState(next) {
  state = next;
  save();
}
