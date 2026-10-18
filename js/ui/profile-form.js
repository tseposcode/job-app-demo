// profile-form.js
// The profile form fields, shared by sign-up setup and the "Edit profile" sheet,
// so the two always ask the same questions. Build with *Fields(), read with read*().

import { FIELDS, PROVINCES, QUALS, TYPES } from '../config.js';
import { $, esc } from '../lib/utils.js';
import { checkChips, checkedValues, selectBox, splitList } from './forms.js';

export const detailsFields = (u) => `
  <div class="grid2"><label class="field"><span>Name</span><input type="text" id="pName" value="${esc(
    u.name,
  )}"></label><label class="field"><span>Surname</span><input type="text" id="pSurname" value="${esc(u.surname)}"></label></div>
  <label class="field"><span>Phone</span><input type="text" id="pPhone" inputmode="tel" value="${esc(u.phone)}"></label>
  <div class="grid2"><label class="field"><span>Town or city</span><input type="text" id="pCity" value="${esc(
    u.city,
  )}"></label><label class="field"><span>Province</span>${selectBox('pProv', PROVINCES, u.province, 'Choose')}</label></div>`;

export const educationFields = (u) => `
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
  )}</textarea></label>`;

export const prefsFields = (p = {}) => `
  <div class="field"><span>Fields you want</span>${checkChips('pf', FIELDS, p.fields || [])}</div>
  <div class="field"><span>Job types</span>${checkChips('pt', TYPES, p.types || [])}</div>
  <div class="field"><span>Provinces</span>${checkChips('pp', PROVINCES, p.provinces || [])}</div>
  <div class="checks"><label class="check"><input type="checkbox" id="pRemote"${p.remote ? ' checked' : ''}><span>Open to remote work</span></label>
  <label class="check"><input type="checkbox" id="pRelocate"${p.relocate ? ' checked' : ''}><span>Willing to relocate</span></label></div>
  <p class="small muted">Willing to relocate: we also apply to jobs outside your provinces.</p>
  <label class="field"><span>Minimum pay per month (rand)</span><input type="number" id="pPay" min="0" step="500" value="${esc(
    p.minPay || '',
  )}"></label>`;

// Each reader returns { data } or { error }.
export function readDetails(root) {
  const name = $('#pName', root).value.trim();
  const surname = $('#pSurname', root).value.trim();
  if (!name || !surname) return { error: 'Add your name and surname.' };
  return {
    data: {
      name,
      surname,
      phone: $('#pPhone', root).value.trim(),
      city: $('#pCity', root).value.trim(),
      province: $('#pProv', root).value,
    },
  };
}

export function readEducation(root) {
  const year = $('#pYear', root).value.trim();
  if (year && !/^\d{4}$/.test(year)) return { error: 'Year completed should be four digits, like 2025.' };
  return {
    data: {
      qual: $('#pQual', root).value,
      gradYear: year,
      study: $('#pStudy', root).value.trim(),
      institution: $('#pInst', root).value.trim(),
      skills: splitList($('#pSkills', root).value),
      experience: $('#pExp', root).value.trim(),
    },
  };
}

export function readPrefs(root) {
  return {
    data: {
      prefs: {
        fields: checkedValues('pf', root),
        types: checkedValues('pt', root),
        provinces: checkedValues('pp', root),
        remote: $('#pRemote', root).checked,
        relocate: $('#pRelocate', root).checked,
        minPay: Math.max(0, parseInt($('#pPay', root).value, 10) || 0),
      },
    },
  };
}
