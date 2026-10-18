// forms.js
// Small builders for form controls used by several sheets.

import { $$, esc } from '../lib/utils.js';

// A row of tick-box chips. Read the ticked values with checkedValues(name).
export const checkChips = (name, options, chosen = []) =>
  `<div class="checks">${options
    .map(
      (o) =>
        `<label class="check"><input type="checkbox" name="${name}" value="${esc(o)}"${
          chosen.includes(o) ? ' checked' : ''
        }><span>${esc(o)}</span></label>`,
    )
    .join('')}</div>`;

export const checkedValues = (name, root = document) =>
  $$(`input[name="${name}"]:checked`, root).map((i) => i.value);

export const selectBox = (id, options, value, placeholder) =>
  `<select id="${id}">${placeholder ? `<option value="">${placeholder}</option>` : ''}${options
    .map((o) => `<option${o === value ? ' selected' : ''}>${esc(o)}</option>`)
    .join('')}</select>`;

export const splitList = (text) =>
  String(text)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

// Show an error line under a form (pass '' to hide it).
export function showError(el, message) {
  el.textContent = message;
  el.hidden = !message;
}

// An in-page "are you sure?" box. The viewer cannot show browser confirm() dialogs.
export function confirmInline(container, { message, yes, no = 'Cancel', onYes, onNo }) {
  container.innerHTML = `<div class="confirm" style="flex:1"><span>${esc(message)}</span><div class="actions"><button class="btn danger" data-yes>${esc(
    yes,
  )}</button><button class="btn" data-no>${esc(no)}</button></div></div>`;
  container.querySelector('[data-yes]').addEventListener('click', onYes);
  container.querySelector('[data-no]').addEventListener('click', onNo);
}
