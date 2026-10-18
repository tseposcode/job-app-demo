// applied.js
// The Applied page: every application, its progress, and filters by status.

import { DAY } from '../config.js';
import { $$, ago, esc } from '../lib/utils.js';
import { jobById } from '../services/jobs.js';
import { myApplications, statusOf } from '../services/applications.js';
import { openJobDetail } from './sheets/job-detail.js';

let filter = 'all';
const WAITING = ['sent', 'viewed'];
const NOTE = {
  interview: 'Employer replied',
  viewed: 'CV opened by employer',
  rejected: 'Position filled',
  withdrawn: 'You withdrew',
  sent: 'Waiting for employer',
};

function track(st) {
  const k = st.key;
  const viewed = ['viewed', 'interview', 'rejected'].includes(k) ? 'done' : '';
  const last = k === 'interview' ? 'done' : k === 'rejected' ? 'fail' : '';
  return `<ol class="track" aria-label="Application progress"><li class="done">Sent</li><li class="${viewed}">Viewed</li><li class="${last}">${
    k === 'rejected' ? 'Not successful' : 'Interview'
  }</li></ol>`;
}

export function render() {
  const apps = myApplications();
  const now = Date.now();
  const counts = { all: 0, active: 0, interview: 0, rejected: 0, withdrawn: 0 };
  for (const a of apps) {
    const k = statusOf(a, now).key;
    counts.all++;
    if (WAITING.includes(k)) counts.active++;
    if (k in counts) counts[k]++;
  }
  const shown = apps.filter((a) => {
    const k = statusOf(a, now).key;
    if (filter === 'all') return true;
    if (filter === 'active') return WAITING.includes(k);
    return k === filter;
  });
  const thisWeek = apps.filter((a) => a.at > now - 7 * DAY).length;
  const chip = (k, label) =>
    `<button class="chip" data-filter="${k}" aria-pressed="${filter === k}">${label} ${counts[k]}</button>`;
  const interviewLine = counts.interview
    ? `${counts.interview} ${counts.interview === 1 ? 'employer wants' : 'employers want'} to interview you.`
    : 'No interview invites yet. Statuses update on their own.';

  const tiles = shown
    .map((a) => {
      const job = jobById(a.jobId);
      const st = statusOf(a, now);
      return `<li class="job">
        <button class="job-open" data-job="${esc(a.jobId)}" ${job ? '' : 'disabled'}>
          <span class="job-h"><span style="min-width:0;display:flex;flex-direction:column;gap:3px"><span class="jt">${esc(
            job ? job.title : a.jobTitle,
          )}</span><span class="who">${esc(job ? job.company : a.company)}${job ? ` · ${esc(job.city)}` : ''}</span></span><span class="state ${
            st.key
          }">${esc(st.label)}</span></span>
          ${st.key === 'withdrawn' ? '' : track(st)}
        </button>
        <div class="job-f"><span class="muted num">${a.method === 'auto' ? 'Auto-applied ' : 'Applied '}${esc(
          ago(a.at),
        )}</span><span class="muted">${NOTE[st.key]}</span></div>
      </li>`;
    })
    .join('');

  const empty = apps.length
    ? '<div class="empty card"><strong>Nothing in this filter.</strong></div>'
    : '<div class="empty card"><strong>No applications yet.</strong><span>Apply from the Jobs tab, or switch on auto-apply.</span><button class="btn sm primary" data-go="jobs">Browse jobs</button></div>';

  return `
    <div class="hello"><h1>Applied jobs</h1><p class="muted">Every job your CV was sent to, and what the employer did next.</p></div>
    <div class="status"><span class="dot"></span><div><strong>${thisWeek} ${
      thisWeek === 1 ? 'application' : 'applications'
    } this week.</strong><span>${interviewLine}</span></div></div>
    <div class="chips" role="group" aria-label="Filter applications">${chip('all', 'All')}${chip('active', 'Waiting')}${chip(
      'interview',
      'Interview',
    )}${chip('rejected', 'Not successful')}</div>
    ${shown.length ? `<ul class="jobs">${tiles}</ul>` : empty}`;
}

export function bind(root, ctx) {
  $$('[data-job]', root).forEach((b) => b.addEventListener('click', () => openJobDetail(b.dataset.job, ctx)));
  $$('[data-filter]', root).forEach((b) =>
    b.addEventListener('click', () => {
      filter = b.dataset.filter;
      ctx.refresh();
    }),
  );
}
