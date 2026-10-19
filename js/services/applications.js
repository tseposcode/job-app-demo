// applications.js
// Applying, withdrawing, auto-apply, and the simulated employer replies
// (Sent → Viewed → Interview or Not successful). No screen code here.

import { MIN } from '../config.js';
import { getState, save } from '../core/store.js';
import { seededRandom, uid } from '../lib/utils.js';
import { match, isStrongMatch, profileGaps } from './matching.js';
import { applyOf, canAutoApply, isClosed } from './jobs.js';
import { currentUser } from './auth.js';
import { canApply } from './access.js';
import { notify } from './notify.js';
import { coverNote } from './cover-note.js';

// Build an application record. `plan` decides when the "employer" views it and
// what they decide. Pass a plan to control it (seed data), or leave it out.
export function makeApplication(state, jobId, email, method, at, plan) {
  const job = state.jobs.find((j) => j.id === jobId) || null;
  const user = state.users[email];
  const id = `a${uid()}`;
  if (!plan) {
    const score = job && user ? match(user, job).score : 60;
    const interviewChance = score >= 90 ? 0.6 : score >= 75 ? 0.4 : 0.2;
    plan = {
      viewAfter: Math.round((1 + seededRandom(`${id}v`) * 1.5) * MIN),
      decideAfter: Math.round((3 + seededRandom(`${id}d`) * 3) * MIN),
      outcome: seededRandom(id) < interviewChance ? 'interview' : 'rejected',
    };
  }
  return {
    id,
    jobId,
    email,
    method,
    at,
    plan,
    withdrawnAt: null,
    jobTitle: job ? job.title : '',
    company: job ? job.company : '',
    // What the employer receives with the CV (see views/sheets/employer-view.js).
    coverNote: job && user ? coverNote(user, job) : '',
    sentTo: job ? applyOf(job) : null,
  };
}

export function statusOf(app, now = Date.now()) {
  if (app.withdrawnAt) return { key: 'withdrawn', label: 'Withdrawn', changed: app.withdrawnAt };
  // Applied on the company's own site: their replies go to the person's email, not to us.
  if (app.method === 'site') return { key: 'sent', label: 'Applied on site', changed: app.at };
  const tView = app.at + app.plan.viewAfter;
  const tDecide = app.at + app.plan.decideAfter;
  if (now >= tDecide) {
    return app.plan.outcome === 'interview'
      ? { key: 'interview', label: 'Interview', changed: tDecide }
      : { key: 'rejected', label: 'Not successful', changed: tDecide };
  }
  if (now >= tView) return { key: 'viewed', label: 'Viewed', changed: tView };
  return { key: 'sent', label: 'Sent', changed: app.at };
}

export function myApplications() {
  const u = currentUser();
  if (!u) return [];
  return getState()
    .apps.filter((a) => a.email === u.email)
    .sort((a, b) => b.at - a.at);
}

export function allApplications() {
  return getState().apps.slice().sort((a, b) => b.at - a.at);
}

// The live (not withdrawn) application for a job, if there is one.
export function applicationFor(jobId) {
  const u = currentUser();
  if (!u) return null;
  return getState().apps.find((a) => a.email === u.email && a.jobId === jobId && !a.withdrawnAt) || null;
}

export function apply(jobId, method) {
  const u = currentUser();
  if (!u || !canApply(u) || applicationFor(jobId)) return null;
  const s = getState();
  const app = makeApplication(s, jobId, u.email, method, Date.now());
  s.apps.push(app);
  save();
  sentMail(u, [app]);
  return app;
}

const HOW = { email: 'by email', in_app: 'through Job Auto', site: "on the company's website" };

// One email per apply action, or per auto-apply round.
function sentMail(u, apps) {
  if (!apps.length) return;
  const one = apps.length === 1;
  const first = apps[0];
  const site = first.method === 'site';
  notify(u.email, {
    kind: 'applied',
    subject: site
      ? `You applied to ${first.jobTitle} on ${first.company}'s website`
      : one
        ? `Your CV was sent to ${first.company}`
        : `Auto-apply sent your CV to ${apps.length} jobs`,
    lines: [
      `Hi ${u.name},`,
      site
        ? `We saved your application to ${first.jobTitle} at ${first.company}. Their reply will come straight to your email.`
        : one
          ? `Your CV and cover note went to ${first.company} for ${first.jobTitle} (${HOW[(first.sentTo || {}).method] || 'through Job Auto'}).`
          : `${first.method === 'auto' ? 'Auto-apply' : 'We'} sent your CV and a cover note to:`,
      ...(one || site ? [] : apps.map((a) => `• ${a.jobTitle}, ${a.company}`)),
      'We will let you know when an employer opens your CV or replies.',
    ],
    action: { label: 'See my applications', kind: 'applied' },
  });
}

// Email the person when an employer opens their CV or replies. Remembers what was sent.
const STATUS_MAIL = {
  viewed: (a) => [`${a.company} opened your CV`, `${a.company} opened your CV for ${a.jobTitle}. We will tell you as soon as they reply.`],
  interview: (a) => [`Interview invitation: ${a.jobTitle}`, `Good news: ${a.company} would like to interview you for ${a.jobTitle}. They will contact you to arrange a time. Check your email and phone.`],
  rejected: (a) => [`Update on ${a.jobTitle}`, `${a.company} has filled the ${a.jobTitle} position. Auto-apply keeps sending your CV to new matches.`],
};

export function syncApplicationMail(u) {
  const t = Date.now();
  let changed = false;
  for (const a of getState().apps) {
    if (a.email !== u.email || a.method === 'site') continue;
    const key = statusOf(a, t).key;
    if (!STATUS_MAIL[key] || a.mailed === key) continue;
    a.mailed = key;
    changed = true;
    const [subject, line] = STATUS_MAIL[key](a);
    notify(u.email, { kind: 'status', subject, lines: [`Hi ${u.name},`, line], action: { label: 'See my applications', kind: 'applied' } });
  }
  if (changed) save();
}

export function withdraw(appId) {
  const app = getState().apps.find((a) => a.id === appId);
  if (app) app.withdrawnAt = Date.now();
  save();
}

// Jobs that count as strong matches and have not been applied to yet.
export function waitingMatches() {
  const u = currentUser();
  if (!u) return [];
  return getState().jobs.filter(
    (j) => !isClosed(j) && !applicationFor(j.id) && canAutoApply(j) && isStrongMatch(match(u, j), u.auto.min),
  );
}

// Jobs that fit apart from being outside the person's provinces: what
// "Willing to relocate" would add. Empty when it is already on.
export function relocationMatches() {
  const u = currentUser();
  if (!u || (u.prefs && u.prefs.relocate)) return [];
  const asRelocating = { ...u, prefs: { ...u.prefs, relocate: true } };
  return getState().jobs.filter(
    (j) =>
      !isClosed(j) &&
      !applicationFor(j.id) &&
      !isStrongMatch(match(u, j), u.auto.min) &&
      isStrongMatch(match(asRelocating, j), u.auto.min),
  );
}

// Auto-apply: send the CV to every new strong match. Returns how many it sent.
// Skips jobs the person withdrew from, so it never re-applies against their wish.
// Needs consent, a finished setup and an active plan (see access.js).
export function runAutoApply() {
  const u = currentUser();
  if (!u || !canApply(u) || u.auto.mode !== 'auto' || u.auto.paused || profileGaps(u).length) return 0;
  const s = getState();
  let sent = 0;
  const made = [];
  for (const job of s.jobs) {
    if (isClosed(job) || applicationFor(job.id) || !canAutoApply(job)) continue;
    const withdrawnBefore = s.apps.some((a) => a.email === u.email && a.jobId === job.id && a.withdrawnAt);
    if (withdrawnBefore) continue;
    if (isStrongMatch(match(u, job), u.auto.min)) {
      const app = makeApplication(s, job.id, u.email, 'auto', Date.now());
      s.apps.push(app);
      made.push(app);
      sent++;
    }
  }
  if (sent) {
    save();
    sentMail(u, made);
  }
  return sent;
}

// How many applications changed status since the person last opened Applied.
export function unseenUpdates() {
  const u = currentUser();
  if (!u) return 0;
  const now = Date.now();
  return myApplications().filter((a) => {
    const st = statusOf(a, now);
    return st.key !== 'sent' && st.key !== 'withdrawn' && st.changed > (u.lastSeen || 0);
  }).length;
}

export function markApplicationsSeen() {
  const u = currentUser();
  if (u) {
    u.lastSeen = Date.now();
    save();
  }
}
