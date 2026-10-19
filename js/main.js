// main.js
// Starts the app: loads saved data, wires the tab bar and file pickers,
// shows the first page, and refreshes every few seconds so employer replies appear.

import { TICK_MS } from './config.js';
import { $, $$ } from './lib/utils.js';
import { initStore, getState } from './core/store.js';
import { ctx, currentPage, go, isLivePage, keepUpToDate, refresh, startAt, updateBadge } from './core/router.js';
import { createSeedState, ensureTestAccount } from './data/seed-state.js';
import { syncJobs } from './services/job-source.js';
import { currentUser, verifyEmail } from './services/auth.js';
import { useResetToken } from './views/reset.js';
import { isSheetOpen } from './ui/sheet.js';
import { setupProfileUploads } from './views/profile.js';

initStore(createSeedState);
ensureTestAccount(getState());

$$('.tab').forEach((t) => t.addEventListener('click', () => go(t.dataset.go)));
$('#bell').addEventListener('click', () => go('inbox'));
setupProfileUploads(ctx);

// Links from emails look like #reset/TOKEN or #verify/TOKEN.
function openEmailLink() {
  const [page, token] = (location.hash || '').replace('#', '').split('/');
  if (!token) return;
  if (page === 'reset') useResetToken(token);
  if (page === 'verify') {
    const r = verifyEmail(token);
    setTimeout(() => ctx.toast(r.ok ? 'Thanks, your email is confirmed.' : r.error), 300);
  }
  history.replaceState(null, '', `#${page === 'verify' ? 'jobs' : page}`);
}
openEmailLink();

const pageFromHash = () => (location.hash || '').replace('#', '').split('/')[0] || 'jobs';
startAt(pageFromHash());
// Typing #admin (or any page name) at the end of the address opens that page.
window.addEventListener('hashchange', () => {
  if (pageFromHash() !== currentPage()) go(pageFromHash());
});
if (currentUser()) ctx.autoApply();
// Bring the job list up to date with the job source, then redraw if anything new arrived.
syncJobs().then((added) => added && !isSheetOpen() && refresh());

setInterval(() => {
  // Only redraw the tab pages, never a form, an open sheet or while someone is typing.
  if (!isLivePage() || isSheetOpen()) {
    keepUpToDate();
    return updateBadge();
  }
  const active = document.activeElement;
  if (active && /INPUT|SELECT|TEXTAREA/.test(active.tagName)) return;
  keepUpToDate();
  if (currentUser()) ctx.autoApply();
  refresh();
}, TICK_MS);

// Handy in the browser console while developing: window.jobAuto.state()
window.jobAuto = { state: getState, el: $ };
