// backend.js
// Where the app's data is kept. store.js loads and saves through here, so moving
// from "saved on this phone" to a real server means adding one backend below.
//
// LIVE: a 'server' backend calls our API instead of localStorage: accounts and
// passwords are checked on the server (passwords hashed there, never in the
// browser), CV files go to private file storage, and the server sends emails,
// runs renewals and reads job feeds. Each person then only downloads their own data.

import { BACKEND, STORAGE_KEY } from '../config.js';

const device = {
  name: 'This device (test version)',
  live: false,
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null; // private window, blocked storage or broken data: start fresh
    }
  },
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the app keeps working for this visit only.
    }
  },
};

const BACKENDS = { device };
export const backend = () => BACKENDS[BACKEND] || device;
