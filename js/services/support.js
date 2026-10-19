// support.js
// Messages people send from the Help page. The admin page lists them.
// LIVE: these go to the support inbox or helpdesk on the server.

import { getState, save } from '../core/store.js';
import { now } from '../core/clock.js';
import { uid } from '../lib/utils.js';
import { notify } from './notify.js';

export const TOPICS = ['My account', 'Payments and my plan', 'Applications and auto-apply', 'My CV and privacy', 'Something else'];

export function sendMessage({ name, email, topic, message }) {
  const key = String(email || '').trim().toLowerCase();
  if (!String(name || '').trim()) return { ok: false, error: 'Add your name.' };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(key)) return { ok: false, error: 'Add an email address we can reply to.' };
  if (String(message || '').trim().length < 10) return { ok: false, error: 'Tell us a bit more (at least 10 characters).' };
  const s = getState();
  s.tickets = s.tickets || [];
  const ticket = { id: `T${uid().toUpperCase()}`, at: now(), name: name.trim(), email: key, topic, message: message.trim(), status: 'open' };
  s.tickets.unshift(ticket);
  save();
  notify(key, {
    kind: 'support',
    subject: `We got your message (${ticket.id})`,
    lines: [`Hi ${ticket.name},`, `Thanks for contacting Job Auto about "${topic}". We usually reply within 2 working days.`, `Your reference is ${ticket.id}.`],
  });
  return { ok: true, ticket };
}

export const allTickets = () => getState().tickets || [];

export function closeTicket(id) {
  const t = allTickets().find((x) => x.id === id);
  if (t) t.status = 'closed';
  save();
}
