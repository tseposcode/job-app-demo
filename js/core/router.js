// router.js
// Decides which page shows, keeps the tab bar and badge in step, and hands
// every page the same small toolkit (ctx): go, refresh, toast, autoApply.
//
// To add a page: create js/views/<name>.js with render() and bind(root, ctx),
// then add it to PAGES below (and to TAB_PAGES if it has a tab).

import { $, $$ } from '../lib/utils.js';
import { currentUser } from '../services/auth.js';
import { markApplicationsSeen, runAutoApply, unseenUpdates } from '../services/applications.js';
import { closeSheet } from '../ui/sheet.js';
import { toast } from '../ui/toast.js';
import * as login from '../views/login.js';
import * as signup from '../views/signup.js';
import * as jobs from '../views/jobs.js';
import * as applied from '../views/applied.js';
import * as profile from '../views/profile.js';
import * as admin from '../views/admin.js';

const PAGES = { login, signup, jobs, applied, profile, admin };
const PUBLIC_PAGES = ['login', 'signup', 'admin']; // reachable without logging in
const TAB_PAGES = ['jobs', 'applied', 'profile'];

let current = 'jobs';

export const ctx = {
  go,
  refresh,
  toast,
  // Run auto-apply and say how many CVs went out. { silent: true } skips the message.
  autoApply({ silent = false } = {}) {
    const sent = runAutoApply();
    if (sent && !silent) toast(`Auto-apply sent your CV to ${sent} new ${sent === 1 ? 'job' : 'jobs'}.`);
    if (sent) refresh();
    return sent;
  },
};

export function go(page) {
  current = page;
  try {
    history.replaceState(null, '', `#${page}`);
  } catch {
    /* some viewers block history changes */
  }
  closeSheet();
  refresh();
  window.scrollTo(0, 0);
}

export function startAt(page) {
  current = PAGES[page] ? page : 'jobs';
  refresh();
}

export const currentPage = () => current;

export function refresh() {
  const user = currentUser();
  if (!user && !PUBLIC_PAGES.includes(current)) current = 'login';
  if (user && (current === 'login' || current === 'signup')) current = 'jobs';

  const showTabs = !!user && TAB_PAGES.includes(current);
  $('#tabs').hidden = !showTabs;
  document.body.classList.toggle('no-tabs', !showTabs);
  $$('.tab').forEach((t) => {
    if (t.dataset.go === current) t.setAttribute('aria-current', 'page');
    else t.removeAttribute('aria-current');
  });
  $('#topPill').textContent = current === 'admin' ? 'Admin' : 'Test version';

  if (user && current === 'applied') markApplicationsSeen();
  updateBadge();

  const root = $('#view');
  const page = PAGES[current];
  root.innerHTML = page.render();
  // Any button with data-go="page" moves to that page.
  $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  page.bind(root, ctx);
}

export function updateBadge() {
  const n = unseenUpdates();
  const badge = $('#badge');
  badge.hidden = !n || current === 'applied';
  badge.textContent = n;
}
