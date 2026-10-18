// jobs.js
// The Jobs page: greeting, auto-apply status, search and filters, job tiles.

import { FIELDS, PROVINCES, TYPES } from '../config.js';
import { $, $$, esc, money, postedText } from '../lib/utils.js';
import { ICON } from '../lib/icons.js';
import { currentUser } from '../services/auth.js';
import { allJobs, isClosed, jobById, openJobs } from '../services/jobs.js';
import { match, profileGaps } from '../services/matching.js';
import { apply, applicationFor, relocationMatches, statusOf, waitingMatches } from '../services/applications.js';
import { save } from '../core/store.js';
import { openJobDetail } from './sheets/job-detail.js';

// Filters survive moving between pages (but not a reload).
const filters = { q: '', type: '', field: '', province: '', sort: 'match' };
const SORTS = { match: 'Best match', new: 'Newest', closing: 'Closing soon', pay: 'Highest pay' };

const scoreClass = (score) => (score >= 80 ? 'hi' : score < 50 ? 'lo' : '');

function statusCard(u) {
  const gaps = profileGaps(u);
  if (gaps.length) {
    return `<div class="status warn"><span class="dot"></span><div><strong>Finish your profile to start applying.</strong><span>Still needed: ${esc(
      gaps.join(', '),
    )}.</span></div><button class="btn sm" data-go="profile">Finish</button></div>`;
  }
  if (u.auto.paused) {
    return '<div class="status off"><span class="dot"></span><div><strong>Auto-apply is paused.</strong><span>Nothing is sent until you turn it back on.</span></div><button class="btn sm" id="resumeAuto">Resume</button></div>';
  }
  if (u.auto.mode === 'auto') {
    const where = u.prefs.relocate ? 'that fits you, anywhere you would relocate,' : 'in your areas';
    return `<div class="status"><span class="dot"></span><div><strong>Auto-apply is on.</strong><span>Your CV goes to every job ${where} at ${u.auto.min}% match or higher.</span></div></div>`;
  }
  const waiting = waitingMatches().length;
  const text = waiting
    ? `${waiting} strong ${waiting === 1 ? 'match is' : 'matches are'} waiting for you.`
    : 'You have applied to all your strong matches.';
  return `<div class="status"><span class="dot"></span><div><strong>One-tap apply.</strong><span>${text}</span></div>${
    waiting ? `<button class="btn sm primary" id="applyAll">Apply to ${waiting}</button>` : ''
  }</div>`;
}

// Good jobs skipped only because they are outside the person's provinces.
function relocateCard(u) {
  if (profileGaps(u).length) return '';
  const n = relocationMatches().length;
  if (!n) return '';
  const them = n === 1 ? 'it' : 'them';
  return `<div class="status warn"><span class="dot"></span><div><strong>${n} more ${n === 1 ? 'job fits' : 'jobs fit'} you outside your provinces.</strong><span>${
    u.auto.mode === 'auto' ? 'Auto-apply skips' : 'We leave out'
  } ${them} because of where ${n === 1 ? 'it is' : 'they are'}. Willing to relocate?</span></div><button class="btn sm" id="relocateOn">Include ${them}</button></div>`;
}

function jobTile(u, job) {
  const m = match(u, job);
  const app = applicationFor(job.id);
  let footer;
  if (app) {
    const st = statusOf(app);
    footer = `<span class="state ${st.key}">${esc(st.label)}</span>`;
  } else if (isClosed(job)) footer = '<span class="muted">Closed</span>';
  else if (!m.qualOk) footer = `<span class="muted">Needs ${esc(job.qual.toLowerCase())}</span>`;
  else footer = `<button class="btn sm primary" data-apply="${job.id}">Apply</button>`;
  const place = job.city !== 'Remote' ? `${esc(job.city)}, ${esc(job.province)}` : esc(job.city);
  return `<li class="job">
    <button class="job-open" data-job="${job.id}" aria-label="${esc(job.title)} at ${esc(job.company)}, details">
      <span class="job-h"><span style="min-width:0;display:flex;flex-direction:column;gap:3px"><span class="jt">${esc(
        job.title,
      )}</span><span class="who">${esc(job.company)} · ${esc(job.type)}</span></span><span class="match ${scoreClass(
        m.score,
      )} num">${m.score}% match</span></span>
      <span class="pay num">${money(job.pay)} <small>per month</small></span>
      <span class="facts"><span class="fact">${ICON.pin}<span>${place}</span></span><span class="fact">${ICON.home}<span>${esc(
        job.mode,
      )}</span></span><span class="fact">${ICON.cap}<span>${esc(job.qual)}</span></span></span>
    </button>
    <div class="job-f"><span class="muted">${esc(postedText(job.posted))}</span>${footer}</div>
  </li>`;
}

function filteredJobs(u) {
  const q = filters.q.trim().toLowerCase();
  const list = allJobs().filter((j) => {
    if (filters.type && j.type !== filters.type) return false;
    if (filters.field && j.field !== filters.field) return false;
    if (filters.province) {
      if (filters.province === 'Remote' ? j.mode !== 'Remote' : j.province !== filters.province) return false;
    }
    if (q && !`${j.title} ${j.company} ${j.city} ${j.field} ${j.skills.join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  });
  const sorters = {
    new: (a, b) => b.posted.localeCompare(a.posted),
    closing: (a, b) => a.closes.localeCompare(b.closes),
    pay: (a, b) => b.pay - a.pay,
    match: (a, b) => match(u, b).score - match(u, a).score,
  };
  return list.sort(sorters[filters.sort]);
}

const options = (list, value, first) =>
  `<option value="">${first}</option>${list
    .map((x) => `<option${x === value ? ' selected' : ''}>${esc(x)}</option>`)
    .join('')}`;

export function render() {
  const u = currentUser();
  const list = filteredJobs(u);
  const filtered = filters.q || filters.type || filters.field || filters.province;
  return `
    <div class="hello"><h1>Hi ${esc(u.name || 'there')}</h1><p class="muted">${openJobs().length} open graduate and entry-level jobs.</p></div>
    ${statusCard(u)}
    ${relocateCard(u)}
    <div class="toolbar">
      <input type="search" id="q" placeholder="Search jobs, companies, skills" value="${esc(filters.q)}" aria-label="Search jobs">
      <div class="filters">
        <select id="fSort" aria-label="Sort">${Object.entries(SORTS)
          .map(([k, label]) => `<option value="${k}"${filters.sort === k ? ' selected' : ''}>${label}</option>`)
          .join('')}</select>
        <select id="fType" aria-label="Job type">${options(TYPES, filters.type, 'All types')}</select>
        <select id="fField" aria-label="Field">${options(FIELDS, filters.field, 'All fields')}</select>
        <select id="fProv" aria-label="Province">${options(['Remote', ...PROVINCES], filters.province, 'Anywhere')}</select>
      </div>
    </div>
    <section class="section">
      <div class="section-h"><h2>${list.length} ${list.length === 1 ? 'job' : 'jobs'}</h2>${
        filtered ? '<button class="linkbtn small" data-clear>Clear filters</button>' : ''
      }</div>
      ${
        list.length
          ? `<ul class="jobs">${list.map((j) => jobTile(u, j)).join('')}</ul>`
          : '<div class="empty card"><strong>No jobs match these filters.</strong><button class="btn sm" data-clear>Clear filters</button></div>'
      }
    </section>`;
}

export function bind(root, ctx) {
  $$('[data-job]', root).forEach((b) => b.addEventListener('click', () => openJobDetail(b.dataset.job, ctx)));
  $$('[data-apply]', root).forEach((b) =>
    b.addEventListener('click', () => {
      if (apply(b.dataset.apply, 'one-tap')) ctx.toast(`Applied to ${jobById(b.dataset.apply).title}.`);
      ctx.refresh();
    }),
  );

  const search = $('#q', root);
  search.addEventListener('input', () => {
    filters.q = search.value;
    const pos = search.selectionStart;
    ctx.refresh();
    const again = $('#q');
    again.focus();
    try {
      again.setSelectionRange(pos, pos);
    } catch {
      /* some inputs do not support selection */
    }
  });
  const onChange = (id, key) =>
    $(id, root).addEventListener('change', (e) => {
      filters[key] = e.target.value;
      ctx.refresh();
    });
  onChange('#fSort', 'sort');
  onChange('#fType', 'type');
  onChange('#fField', 'field');
  onChange('#fProv', 'province');
  $$('[data-clear]', root).forEach((b) =>
    b.addEventListener('click', () => {
      Object.assign(filters, { q: '', type: '', field: '', province: '' });
      ctx.refresh();
    }),
  );

  $('#relocateOn', root)?.addEventListener('click', () => {
    currentUser().prefs.relocate = true;
    save();
    if (!ctx.autoApply()) ctx.toast('Willing to relocate is on. Change it any time on your profile.');
    ctx.refresh();
  });
  $('#resumeAuto', root)?.addEventListener('click', () => {
    currentUser().auto.paused = false;
    save();
    ctx.autoApply();
    ctx.refresh();
  });
  $('#applyAll', root)?.addEventListener('click', () => {
    let n = 0;
    for (const job of waitingMatches()) if (apply(job.id, 'one-tap')) n++;
    ctx.toast(`Applied to ${n} ${n === 1 ? 'job' : 'jobs'}.`);
    ctx.refresh();
  });
}
