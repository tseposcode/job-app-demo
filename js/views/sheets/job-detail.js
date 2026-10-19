// job-detail.js
// The sheet that opens when you tap a job: details, why it matches, apply or withdraw.

import { $, $$, esc, fmtDate, money } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { currentUser } from '../../services/auth.js';
import { APPLY_METHODS } from '../../config.js';
import { applyOf, isClosed, jobById } from '../../services/jobs.js';
import { isLiveSource } from '../../services/job-source.js';
import { match, profileGaps } from '../../services/matching.js';
import { apply, applicationFor, statusOf, withdraw } from '../../services/applications.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { openEmployerView } from './employer-view.js';
import { confirmInline } from '../../ui/forms.js';

function howToApply(job) {
  const a = applyOf(job);
  const text = {
    email: `Job Auto emails your CV and a short cover note to the employer${a.to ? ` (${a.to})` : ''}. Their reply comes to your email and shows on Applied.`,
    site: "This employer takes applications on its own website. Auto-apply can't fill in other websites, so apply there, then tap \"I applied there\" so we can keep track.",
    in_app: 'The employer receives your CV and cover note in Job Auto, and their reply shows on Applied.',
  }[a.method];
  return `<section class="section"><h2>How to apply</h2><div class="card"><strong>${esc(APPLY_METHODS[a.method])}</strong><span class="small">${esc(
    text,
  )}</span><span class="small muted">Listing from: ${esc(job.source || 'Job Auto')}</span></div></section>`;
}

function actionArea(u, job, m, app) {
  if (app) {
    const st = statusOf(app);
    return `${
      app.method === 'site' ? '' : '<button class="btn wide" id="empView">See what the employer received</button>'
    }<div class="actions" id="wdBox"><span class="state ${st.key}" style="align-self:center">${esc(
      st.label,
    )}</span><button class="btn danger" id="wd">Withdraw application</button></div>`;
  }
  if (isClosed(job)) return '<p class="muted">Applications for this job have closed.</p>';
  const gaps = profileGaps(u);
  if (gaps.length) {
    return `<div class="status warn"><span class="dot"></span><div><strong>Finish your profile first.</strong><span>Still needed: ${esc(
      gaps.join(', '),
    )}.</span></div></div><button class="btn primary wide" data-go="profile">Go to profile</button>`;
  }
  if (!m.qualOk) {
    return `<p class="muted">This job needs at least a ${esc(
      job.qual.toLowerCase(),
    )}. Update your qualification on your profile if you have one.</p>`;
  }
  if (applyOf(job).method === 'site') {
    return '<div class="actions"><button class="btn primary" id="siteOpen">Open their website</button><button class="btn" id="siteDone">I applied there</button></div>';
  }
  return '<button class="btn primary wide" id="sheetApply">Apply with my CV</button>';
}

export function openJobDetail(jobId, ctx) {
  const u = currentUser();
  const job = jobById(jobId);
  if (!job || !u) return;
  const m = match(u, job);
  const app = applicationFor(job.id);
  const cls = m.score >= 80 ? 'hi' : m.score < 50 ? 'lo' : '';

  const root = openSheet(`
    <div class="sheet-h"><div><h3>${esc(job.title)}</h3><span class="who">${esc(job.company)} · ${esc(
      job.type,
    )}</span></div><button class="x" data-close aria-label="Close">${ICON.x}</button></div>
    <div class="card"><div class="job-h"><span class="pay num">${money(job.pay)} <small>per month</small></span><span class="match ${cls} num">${
      m.score
    }% match</span></div>
      <div class="facts"><span class="fact">${ICON.pin}<span>${esc(job.city)}, ${esc(job.province)}</span></span><span class="fact">${
        ICON.home
      }<span>${esc(job.mode)}</span></span><span class="fact">${ICON.cap}<span>${esc(job.qual)} or higher</span></span><span class="fact">${
        ICON.type
      }<span>Closes ${esc(fmtDate(job.closes))}</span></span></div></div>
    <section class="section"><h2>Why this match</h2><ul class="why card">${m.reasons
      .map((r) => `<li class="${r.ok ? 'ok' : 'no'}"><b aria-hidden="true">${r.ok ? '✓' : '–'}</b><span>${esc(r.text)}</span></li>`)
      .join('')}</ul></section>
    <section class="section"><h2>About the job</h2><p class="prose">${esc(job.desc)}</p></section>
    <section class="section"><h2>Skills</h2><div class="skills">${job.skills
      .map((sk) => `<span class="skill${m.have.includes(sk) ? '' : ' miss'}">${esc(sk)}</span>`)
      .join('')}</div></section>
    ${howToApply(job)}
    ${actionArea(u, job, m, app)}`);

  $('#empView', root)?.addEventListener('click', () => openEmployerView(app));
  $('#siteOpen', root)?.addEventListener('click', () => {
    if (!isLiveSource()) return ctx.toast('Test version: this company website is made up.');
    window.open(applyOf(job).url, '_blank', 'noopener');
  });
  $('#siteDone', root)?.addEventListener('click', () => {
    if (apply(job.id, 'site')) ctx.toast(`Saved: you applied to ${job.title} on their website.`);
    closeSheet();
    ctx.refresh();
  });

  $('#sheetApply', root)?.addEventListener('click', () => {
    if (apply(job.id, 'one-tap')) ctx.toast(`Applied to ${job.title}.`);
    closeSheet();
    ctx.refresh();
  });
  $('#wd', root)?.addEventListener('click', () => {
    confirmInline($('#wdBox', root), {
      message: 'Withdraw this application? The employer will no longer see it.',
      yes: 'Withdraw',
      no: 'Keep it',
      onYes: () => {
        withdraw(app.id);
        ctx.toast('Application withdrawn.');
        closeSheet();
        ctx.refresh();
      },
      onNo: () => openJobDetail(jobId, ctx),
    });
  });
  $$('[data-go]', root).forEach((b) => b.addEventListener('click', () => ctx.go(b.dataset.go)));
}
