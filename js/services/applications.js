// applications.js
// Applying, withdrawing, auto-apply, and the simulated employer replies
// (Sent → Viewed → Interview or Not successful). No screen code here.

import { MIN } from '../config.js';
import { getState, save } from '../core/store.js';
import { seededRandom, uid } from '../lib/utils.js';
import { match, isStrongMatch, profileGaps } from './matching.js';
import { isClosed } from './jobs.js';
import { currentUser } from './auth.js';
import { canApply } from './access.js';

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
  };
}

export function statusOf(app, now = Date.now()) {
  if (app.withdrawnAt) return { key: 'withdrawn', label: 'Withdrawn', changed: app.withdrawnAt };
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
  return app;
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
    (j) => !isClosed(j) && !applicationFor(j.id) && isStrongMatch(match(u, j), u.auto.min),
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
  for (const job of s.jobs) {
    if (isClosed(job) || applicationFor(job.id)) continue;
    const withdrawnBefore = s.apps.some((a) => a.email === u.email && a.jobId === job.id && a.withdrawnAt);
    if (withdrawnBefore) continue;
    if (isStrongMatch(match(u, job), u.auto.min)) {
      s.apps.push(makeApplication(s, job.id, u.email, 'auto', Date.now()));
      sent++;
    }
  }
  if (sent) save();
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
