// notify.js
// The emails Job Auto sends. In the test version they land in the in-app Inbox
// (bell at the top), so you can see exactly what a person would receive.
//
// LIVE: the server sends these through an email service; the Inbox can stay as
// a copy of what was sent.

import { MAIL_FROM } from '../config.js';
import { getState, save } from '../core/store.js';
import { now } from '../core/clock.js';
import { uid } from '../lib/utils.js';

const MAX = 100;

// lines: paragraphs of the email. action: an optional button { label, kind, token }.
export function notify(email, { kind, subject, lines, action = null }) {
  const s = getState();
  s.mail = s.mail || {};
  const box = (s.mail[email] = s.mail[email] || []);
  box.unshift({ id: `m${uid()}`, at: now(), from: MAIL_FROM, to: email, kind, subject, lines, action, read: false });
  if (box.length > MAX) box.length = MAX;
  save();
}

export const inbox = (email) => ((getState().mail || {})[email] || []).slice();
export const unreadCount = (email) => inbox(email).filter((m) => !m.read).length;

export function markRead(email, id) {
  const m = inbox(email).find((x) => x.id === id);
  if (m && !m.read) {
    m.read = true;
    save();
  }
}

export function markAllRead(email) {
  inbox(email).forEach((m) => {
    m.read = true;
  });
  save();
}

export function deleteMail(email) {
  const s = getState();
  if (s.mail) delete s.mail[email];
  save();
}
