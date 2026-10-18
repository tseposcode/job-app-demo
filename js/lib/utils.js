// utils.js
// Small helpers with no app knowledge: finding elements, escaping text,
// formatting money and dates. Safe to use anywhere.

import { DAY, MIN } from '../config.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Always escape user text before putting it into HTML.
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// R14 000 style, with a thin space between thousands.
export const money = (n) =>
  'R' + Math.round(n).toLocaleString('en-ZA').replace(/[,  ]/g, ' ');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(iso) {
  const p = String(iso).split('-');
  if (p.length < 3) return iso;
  return `${+p[2]} ${MONTHS[+p[1] - 1]} ${p[0]}`;
}

export function ago(t) {
  const d = Date.now() - t;
  if (d < MIN) return 'just now';
  if (d < 60 * MIN) return `${Math.floor(d / MIN)} min ago`;
  if (d < DAY) return `${Math.floor(d / 3600000)} h ago`;
  const days = Math.floor(d / DAY);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

export function postedText(iso) {
  const days = Math.floor((Date.now() - new Date(`${iso}T08:00:00`).getTime()) / DAY);
  if (Number.isNaN(days)) return '';
  if (days <= 0) return 'Posted today';
  if (days === 1) return 'Posted yesterday';
  return `Posted ${days} days ago`;
}

export const uid = () => Math.random().toString(36).slice(2, 9);

// Repeatable "random" number from 0 to 1 for a given text, so a simulated
// outcome stays the same every time the page reloads.
export function seededRandom(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 2654435761);
  return ((h >>> 0) % 1000) / 1000;
}

export const initials = (u) => ((u.name || '?')[0] + ((u.surname || '')[0] || '')).toUpperCase();

// Demo-only hash so passwords are not stored as plain text on the device.
// A real version must hash passwords on a server, never in the browser.
export function hashPass(s) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
}
