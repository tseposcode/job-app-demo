// clock.js
// "Now" for plans and payments. The admin can move this test clock forward to
// show renewals, failed payments and reminders without waiting a month.
// Job statuses still use the real time.

import { DAY } from '../config.js';
import { getState, save } from './store.js';

export const offset = () => getState().clockOffset || 0;
export const now = () => Date.now() + offset();
export const offsetDays = () => Math.round(offset() / DAY);

export function jumpDays(days) {
  getState().clockOffset = offset() + days * DAY;
  save();
}

export function jumpTo(t) {
  getState().clockOffset = Math.max(0, t - Date.now());
  save();
}

export function resetClock() {
  getState().clockOffset = 0;
  save();
}
