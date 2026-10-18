// profile-edit.js
// The "Edit profile" sheet: personal details, education, skills, preferences.
// The fields themselves come from ui/profile-form.js (shared with sign-up).

import { $ } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { save } from '../../core/store.js';
import { currentUser } from '../../services/auth.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';
import { showError } from '../../ui/forms.js';
import { detailsFields, educationFields, prefsFields, readDetails, readEducation, readPrefs } from '../../ui/profile-form.js';

export function openProfileEdit(ctx) {
  const u = currentUser();
  const root = openSheet(`
    <div class="sheet-h"><div><h3>Edit profile</h3><span class="who">Employers see this with your CV.</span></div><button class="x" data-close aria-label="Close">${
      ICON.x
    }</button></div>
    <form class="form" id="pForm" novalidate>
      <h2>Personal details</h2>${detailsFields(u)}
      <h2>Education and skills</h2>${educationFields(u)}
      <h2>Job preferences</h2>${prefsFields(u.prefs)}
      <p class="err" id="pErr" hidden></p>
      <div class="actions"><button class="btn" type="button" data-close>Cancel</button><button class="btn primary" type="submit">Save profile</button></div>
    </form>`);

  $('#pForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const parts = [readDetails(root), readEducation(root), readPrefs(root)];
    const failed = parts.find((p) => p.error);
    if (failed) return showError($('#pErr', root), failed.error);
    parts.forEach((p) => Object.assign(u, p.data));
    save();
    closeSheet();
    ctx.toast('Profile saved.');
    ctx.autoApply();
    ctx.refresh();
  });
}
