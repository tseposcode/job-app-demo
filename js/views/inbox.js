// inbox.js
// The Inbox (bell at the top): every email Job Auto sent this person.
// In the live app these go to their real email too.

import { $, $$, ago, esc, fmtDay } from '../lib/utils.js';
import { ICON } from '../lib/icons.js';
import { currentUser, verifyEmail } from '../services/auth.js';
import { inbox, markAllRead, markRead } from '../services/notify.js';
import { closeSheet, openSheet } from '../ui/sheet.js';
import { useResetToken } from './reset.js';

export function render() {
  const u = currentUser();
  const mail = inbox(u.email);
  const rows = mail
    .map(
      (m) => `<li><button class="mail${m.read ? '' : ' unread'}" data-mail="${m.id}">
        <span class="mail-h"><strong>${esc(m.subject)}</strong><span class="muted small num">${esc(ago(m.at))}</span></span>
        <span class="muted small mail-s">${esc((m.lines[1] || m.lines[0] || '').slice(0, 110))}</span></button></li>`,
    )
    .join('');
  return `<div class="hello"><h1>Inbox</h1><p class="muted">Emails we sent to ${esc(u.email)}.</p></div>
    <div class="status warn"><span class="dot"></span><div><strong>Test version</strong><span>No real emails are sent. This shows what you would receive.</span></div></div>
    ${
      mail.length
        ? `<div class="section-h"><span class="small muted">${mail.filter((m) => !m.read).length} unread</span><button class="linkbtn small" id="allRead">Mark all as read</button></div>
           <ul class="list mails">${rows}</ul>`
        : '<div class="empty card"><strong>No emails yet.</strong></div>'
    }
    <button class="btn ghost" data-go="jobs">Back to jobs</button>`;
}

export function openMail(id, ctx) {
  const u = currentUser();
  const m = inbox(u.email).find((x) => x.id === id);
  if (!m) return;
  markRead(u.email, id);
  const root = openSheet(`
    <div class="sheet-h"><div><h3>${esc(m.subject)}</h3><span class="who">${esc(fmtDay(m.at))}</span></div><button class="x" data-close aria-label="Close">${ICON.x}</button></div>
    <dl class="list mail-meta"><div class="row"><dt>From</dt><dd>${esc(m.from)}</dd></div><div class="row"><dt>To</dt><dd>${esc(m.to)}</dd></div></dl>
    <div class="card email">${m.lines.map((l) => `<p>${esc(l)}</p>`).join('')}${
      m.action ? `<button class="btn primary" id="mailAct">${esc(m.action.label)}</button>` : ''
    }<p class="small muted">Job Auto · a product of Gentle-TT (Pty) Ltd</p></div>`);
  $('#mailAct', root)?.addEventListener('click', () => {
    const a = m.action;
    closeSheet();
    if (a.kind === 'verify') {
      const r = verifyEmail(a.token);
      ctx.toast(r.ok ? 'Thanks, your email is confirmed.' : r.error);
      return ctx.refresh();
    }
    if (a.kind === 'reset') {
      useResetToken(a.token);
      return ctx.go('reset');
    }
    ctx.go(a.kind); // a page name: profile, subscribe, applied, jobs
  });
  ctx.refresh();
}

export function bind(root, ctx) {
  $$('[data-mail]', root).forEach((b) => b.addEventListener('click', () => openMail(b.dataset.mail, ctx)));
  $('#allRead', root)?.addEventListener('click', () => {
    markAllRead(currentUser().email);
    ctx.refresh();
  });
}
