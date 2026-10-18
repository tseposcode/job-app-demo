// sheet.js
// The panel that slides up from the bottom (job details, edit forms).
// openSheet(html) shows it; any element with data-close closes it.

import { $, $$ } from '../lib/utils.js';

export function openSheet(html) {
  const root = $('#sheetRoot');
  root.innerHTML = `<div class="sheet-wrap" id="sheetWrap"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const wrap = $('#sheetWrap');
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeSheet();
  });
  $$('[data-close]', root).forEach((b) => b.addEventListener('click', closeSheet));
  document.body.style.overflow = 'hidden';
  root.querySelector('.x')?.focus();
  return root;
}

export function closeSheet() {
  $('#sheetRoot').innerHTML = '';
  document.body.style.overflow = '';
}

export const isSheetOpen = () => !!$('#sheetWrap');

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isSheetOpen()) closeSheet();
});
