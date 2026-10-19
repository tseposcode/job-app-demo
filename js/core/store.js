// store.js
// The single place that holds the app's data. Saving goes through core/backend.js.
// Every other file reads data through getState() and calls save() after a change.
//
// Shape of the data:
//   { version, pin, session, jobs: [...], users: { email: user }, apps: [...],
//     mail: { email: [...] }, resets: { token: {...} }, tickets: [...], clockOffset }

import { backend } from './backend.js';

let state = null;

// Load saved data, or create it with createSeed() the first time.
export function initStore(createSeed) {
  state = backend().load() || createSeed();
  save();
  return state;
}

export function getState() {
  if (!state) throw new Error('store.js: call initStore() before getState()');
  return state;
}

export function save() {
  backend().save(state);
}

// Replace everything, for example when the admin resets the test data.
export function replaceState(next) {
  state = next;
  save();
}
