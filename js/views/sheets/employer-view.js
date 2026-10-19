// employer-view.js (sheet)
// "See what the employer received": the application exactly as the employer
// gets it: the email (or Job Auto message), the cover note, the profile summary
// and the CV attachment.

import { APPLY_METHODS } from '../../config.js';
import { esc, fmtDay } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { currentUser } from '../../services/auth.js';
import { coverNote } from '../../services/cover-note.js';
import { applyOf, jobById } from '../../services/jobs.js';
import { openSheet } from '../../ui/sheet.js';

export function openEmployerView(app) {
  const u = currentUser();
  const job = jobById(app.jobId);
  const how = app.sentTo || applyOf(job);
  const note = app.coverNote || (job ? coverNote(u, job) : '');
  const to = how.method === 'email' ? how.to : `${app.company} hiring team (in Job Auto)`;
  const facts = [
    ['Phone', u.phone],
    ['Email', u.email],
    ['Lives in', [u.city, u.province].filter(Boolean).join(', ')],
    ['Qualification', [u.qual, u.study, u.institution, u.gradYear].filter(Boolean).join(' · ')],
    ['Skills', (u.skills || []).join(', ')],
    ['Willing to relocate', u.prefs && u.prefs.relocate ? 'Yes' : 'No'],
  ].filter(([, v]) => v);
  openSheet(`
    <div class="sheet-h"><div><h3>What the employer received</h3><span class="who">${esc(APPLY_METHODS[how.method] || '')} · ${esc(fmtDay(app.at))}</span></div><button class="x" data-close aria-label="Close">${ICON.x}</button></div>
    <dl class="list mail-meta">
      <div class="row"><dt>From</dt><dd>${esc(`${u.name} ${u.surname}`)} via Job Auto &lt;apply@jobauto.example&gt;</dd></div>
      <div class="row"><dt>To</dt><dd>${esc(to)}</dd></div>
      <div class="row"><dt>Reply to</dt><dd>${esc(u.email)}</dd></div>
      <div class="row"><dt>Subject</dt><dd>Application: ${esc(app.jobTitle)} – ${esc(`${u.name} ${u.surname}`)}</dd></div>
    </dl>
    <div class="card email"><p class="prose">${esc(note)}</p></div>
    <section class="section"><h2>Profile summary</h2><dl class="list">${facts
      .map(([k, v]) => `<div class="row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join('')}</dl></section>
    <div class="cv attach"><span class="doc">${esc(((u.cv && u.cv.name) || 'CV.pdf').split('.').pop().toUpperCase().slice(0, 4))}</span><div><strong>${esc(
      (u.cv && u.cv.name) || 'CV'
    )}</strong><span>Attached</span></div></div>
    <p class="small muted">Your ID number, and any race, religion, health or criminal record details, are never sent. Only employers you apply to receive this.</p>
    <button class="btn primary wide" data-close>Close</button>`);
}
