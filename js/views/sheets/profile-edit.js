// profile-edit.js
// The "Edit profile" sheet: personal details, education, skills, preferences.

import { FIELDS, PROVINCES, QUALS, TYPES } from '../../config.js';
import { $, esc } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { save } from '../../core/store.js';
import { currentUser } from '../../services/auth.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { checkChips, checkedValues, selectBox, showError, splitList } from '../../ui/forms.js';

export function openProfileEdit(ctx) {
  const u = currentUser();
  const p = u.prefs || {};
  const root = openSheet(`
    <div class="sheet-h"><div><h3>Edit profile</h3><span class="who">Employers see this with your CV.</span></div><button class="x" data-close aria-label="Close">${
      ICON.x
    }</button></div>
    <form class="form" id="pForm" novalidate>
      <h2>Personal details</h2>
      <div class="grid2"><label class="field"><span>Name</span><input type="text" id="pName" value="${esc(
        u.name,
      )}"></label><label class="field"><span>Surname</span><input type="text" id="pSurname" value="${esc(u.surname)}"></label></div>
      <label class="field"><span>Phone</span><input type="text" id="pPhone" inputmode="tel" value="${esc(u.phone)}"></label>
      <div class="grid2"><label class="field"><span>Town or city</span><input type="text" id="pCity" value="${esc(
        u.city,
      )}"></label><label class="field"><span>Province</span>${selectBox('pProv', PROVINCES, u.province, 'Choose')}</label></div>
      <h2>Education and skills</h2>
      <div class="grid2"><label class="field"><span>Highest qualification</span>${selectBox(
        'pQual',
        QUALS,
        u.qual,
        'Choose',
      )}</label><label class="field"><span>Year completed</span><input type="text" id="pYear" inputmode="numeric" maxlength="4" value="${esc(
        u.gradYear,
      )}"></label></div>
      <label class="field"><span>What you studied</span><input type="text" id="pStudy" value="${esc(u.study)}" placeholder="e.g. BCom Accounting"></label>
      <label class="field"><span>Institution</span><input type="text" id="pInst" value="${esc(u.institution)}"></label>
      <label class="field"><span>Skills, separated by commas</span><input type="text" id="pSkills" value="${esc(
        (u.skills || []).join(', '),
      )}" placeholder="Excel, Power BI, Communication"></label>
      <label class="field"><span>Experience</span><textarea id="pExp" placeholder="Internships, part-time work, volunteering">${esc(
        u.experience,
      )}</textarea></label>
      <h2>Job preferences</h2>
      <div class="field"><span>Fields you want</span>${checkChips('pf', FIELDS, p.fields)}</div>
      <div class="field"><span>Job types</span>${checkChips('pt', TYPES, p.types)}</div>
      <div class="field"><span>Provinces</span>${checkChips('pp', PROVINCES, p.provinces)}</div>
      <label class="check"><input type="checkbox" id="pRemote"${p.remote ? ' checked' : ''}><span>Open to remote work</span></label>
      <label class="field"><span>Minimum pay per month (rand)</span><input type="number" id="pPay" min="0" step="500" value="${esc(
        p.minPay || '',
      )}"></label>
      <p class="err" id="pErr" hidden></p>
      <div class="actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Save profile</button></div>
    </form>`);

  $('#pForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#pName', root).value.trim();
    const surname = $('#pSurname', root).value.trim();
    const year = $('#pYear', root).value.trim();
    const err = $('#pErr', root);
    if (!name || !surname) return showError(err, 'Add your name and surname.');
    if (year && !/^\d{4}$/.test(year)) return showError(err, 'Year completed should be four digits, like 2025.');

    Object.assign(u, {
      name,
      surname,
      phone: $('#pPhone', root).value.trim(),
      city: $('#pCity', root).value.trim(),
      province: $('#pProv', root).value,
      qual: $('#pQual', root).value,
      gradYear: year,
      study: $('#pStudy', root).value.trim(),
      institution: $('#pInst', root).value.trim(),
      skills: splitList($('#pSkills', root).value),
      experience: $('#pExp', root).value.trim(),
      prefs: {
        fields: checkedValues('pf', root),
        types: checkedValues('pt', root),
        provinces: checkedValues('pp', root),
        remote: $('#pRemote', root).checked,
        minPay: Math.max(0, parseInt($('#pPay', root).value, 10) || 0),
      },
    });
    save();
    closeSheet();
    ctx.toast('Profile saved.');
    ctx.autoApply();
    ctx.refresh();
  });
}
