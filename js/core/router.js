// router.js
// Decides which page shows, keeps the tab bar and badge in step, and hands
// every page the same small toolkit (ctx): go, refresh, toast, autoApply.
//
// The sign-up guard: a logged-in person who has not agreed to the privacy
// notice, finished setup or picked a plan is always sent to that step first
// (see services/access.js). Admin is the only page that skips it.
//
// To add a page: create js/views/<name>.js with render() and bind(root, ctx),
// then add it to PAGES below (and to TAB_PAGES if it has a tab).

import { $, $$ } from '../lib/utils.js';
import { currentUser, logout } from '../services/auth.js';
import { pendingStep } from '../services/access.js';
import { markApplicationsSeen, runAutoApply, unseenUpdates } from '../services/applications.js';
import { closeSheet } from '../ui/sheet.js';
import { toast } from '../ui/toast.js';
import * as login from '../views/login.js';
import * as signup from '../views/signup.js';
import * as consent from '../views/consent.js';
import * as setup from '../views/setup.js';
import * as subscribe from '../views/subscribe.js';
import * as jobs from '../views/jobs.js';
import * as applied from '../views/applied.js';
import * as profile from '../views/profile.js';
import * as admin from '../views/admin.js';

const PAGES = { login, signup, consent, setup, subscribe, jobs, applied, profile, admin };
const PUBLIC_PAGES = ['login', 'signup', 'admin']; // reachable without logging in
const SIGNUP_PAGES = ['login', 'signup', 'consent', 'setup', 'subscribe']; // done once you are in
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
  closeSheet();
  refresh();
  window.scrollTo(0, 0);
}

export function startAt(page) {
  current = PAGES[page] ? page : 'jobs';
  refresh();
}

export const currentPage = () => current;
// Pages that change on their own (statuses) and have no half-typed forms.
export const isLivePage = () => TAB_PAGES.includes(current);

// Send the person to the page they are allowed to see right now.
function resolvePage(user) {
  if (!PAGES[current]) current = 'jobs';
  if (!user) return PUBLIC_PAGES.includes(current) ? current : 'login';
  if (current === 'admin') return current;
  const step = pendingStep(user);
  if (step) return step;
  return SIGNUP_PAGES.includes(current) ? 'jobs' : current;
}

export function refresh() {
  const user = currentUser();
  current = resolvePage(user);
  if (location.hash !== `#${current}`) {
    try {
      history.replaceState(null, '', `#${current}`);
    } catch {
      /* some viewers block history changes */
    }
  }

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
  // Any button with data-logout logs out.
  $$('[data-logout]', root).forEach((b) =>
    b.addEventListener('click', () => {
      logout();
      go('login');
    }),
  );
  page.bind(root, ctx);
}

export function updateBadge() {
  const n = unseenUpdates();
  const badge = $('#badge');
  badge.hidden = !n || current === 'applied';
  badge.textContent = n;
}
