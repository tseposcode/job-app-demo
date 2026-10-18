// main.js
// Starts the app: loads saved data, wires the tab bar and file pickers,
// shows the first page, and refreshes every few seconds so employer replies appear.

import { TICK_MS } from './config.js';
import { $, $$ } from './lib/utils.js';
import { initStore, getState } from './core/store.js';
import { ctx, currentPage, go, isLivePage, refresh, startAt, updateBadge } from './core/router.js';
import { createSeedState, ensureTestAccount } from './data/seed-state.js';
import { currentUser } from './services/auth.js';
import { isSheetOpen } from './ui/sheet.js';
import { setupProfileUploads } from './views/profile.js';

initStore(createSeedState);
ensureTestAccount(getState());

$$('.tab').forEach((t) => t.addEventListener('click', () => go(t.dataset.go)));
setupProfileUploads(ctx);

const pageFromHash = () => (location.hash || '').replace('#', '') || 'jobs';
startAt(pageFromHash());
// Typing #admin (or any page name) at the end of the address opens that page.
window.addEventListener('hashchange', () => {
  if (pageFromHash() !== currentPage()) go(pageFromHash());
});
if (currentUser()) ctx.autoApply();

setInterval(() => {
  // Only redraw the tab pages, never a form, an open sheet or while someone is typing.
  if (!isLivePage() || isSheetOpen()) return updateBadge();
  const active = document.activeElement;
  if (active && /INPUT|SELECT|TEXTAREA/.test(active.tagName)) return;
  if (currentUser()) ctx.autoApply();
  refresh();
}, TICK_MS);

// Handy in the browser console while developing: window.jobAuto.state()
window.jobAuto = { state: getState, el: $ };
