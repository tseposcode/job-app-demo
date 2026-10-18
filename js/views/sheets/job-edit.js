// job-edit.js
// The admin sheet for adding a new job or editing an existing one.

import { FIELDS, MODES, PROVINCES, QUALS, TYPES } from '../../config.js';
import { $, esc } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { addJob, jobById, updateJob } from '../../services/jobs.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { selectBox, showError, splitList } from '../../ui/forms.js';

const BLANK = {
  title: '',
  company: '',
  type: TYPES[0],
  field: FIELDS[0],
  city: '',
  province: 'Gauteng',
  mode: 'On-site',
  qual: 'Degree',
  pay: '',
  closes: '',
  skills: [],
  desc: '',
};

export function openJobEdit(jobId, ctx) {
  const j = jobId ? jobById(jobId) : BLANK;
  const root = openSheet(`
    <div class="sheet-h"><div><h3>${jobId ? 'Edit job' : 'Add job'}</h3><span class="who">Saved on this device.</span></div><button class="x" data-close aria-label="Close">${
      ICON.x
    }</button></div>
    <form class="form" id="jForm" novalidate>
      <label class="field"><span>Job title</span><input type="text" id="jTitle" value="${esc(j.title)}"></label>
      <label class="field"><span>Company</span><input type="text" id="jCompany" value="${esc(j.company)}"></label>
      <div class="grid2"><label class="field"><span>Type</span>${selectBox('jType', TYPES, j.type)}</label><label class="field"><span>Field</span>${selectBox(
        'jField',
        FIELDS,
        j.field,
      )}</label></div>
      <div class="grid2"><label class="field"><span>Town or city</span><input type="text" id="jCity" value="${esc(
        j.city,
      )}"></label><label class="field"><span>Province</span>${selectBox('jProv', PROVINCES, j.province)}</label></div>
      <div class="grid2"><label class="field"><span>Work mode</span>${selectBox(
        'jMode',
        MODES,
        j.mode,
      )}</label><label class="field"><span>Minimum qualification</span>${selectBox('jQual', QUALS, j.qual)}</label></div>
      <div class="grid2"><label class="field"><span>Pay per month (rand)</span><input type="number" id="jPay" min="0" step="500" value="${esc(
        j.pay,
      )}"></label><label class="field"><span>Closing date</span><input type="date" id="jCloses" value="${esc(j.closes)}"></label></div>
      <label class="field"><span>Skills, separated by commas</span><input type="text" id="jSkills" value="${esc(j.skills.join(', '))}"></label>
      <label class="field"><span>Description</span><textarea id="jDesc">${esc(j.desc)}</textarea></label>
      <p class="err" id="jErr" hidden></p>
      <div class="actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">${
        jobId ? 'Save job' : 'Add job'
      }</button></div>
    </form>`);

  $('#jForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('#jTitle', root).value.trim();
    const company = $('#jCompany', root).value.trim();
    const city = $('#jCity', root).value.trim();
    const pay = parseInt($('#jPay', root).value, 10);
    const closes = $('#jCloses', root).value;
    const err = $('#jErr', root);
    if (!title || !company || !city) return showError(err, 'Add a title, company and town or city.');
    if (!(pay >= 0)) return showError(err, 'Add the monthly pay as a number, like 9000.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(closes)) return showError(err, 'Choose a closing date.');

    const data = {
      title,
      company,
      city,
      pay,
      closes,
      type: $('#jType', root).value,
      field: $('#jField', root).value,
      province: $('#jProv', root).value,
      mode: $('#jMode', root).value,
      qual: $('#jQual', root).value,
      skills: splitList($('#jSkills', root).value),
      desc: $('#jDesc', root).value.trim() || 'No description yet.',
    };
    if (jobId) {
      updateJob(jobId, data);
      ctx.toast('Job saved.');
    } else {
      addJob(data);
      ctx.toast('Job added.');
    }
    closeSheet();
    ctx.refresh();
  });
}
