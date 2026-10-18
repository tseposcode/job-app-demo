// privacy-notice.js (sheet)
// Shows the full privacy notice. Used on the sign-up privacy step and on Profile.

import { esc } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { NOTICE_TITLE, SECTIONS } from '../../data/privacy-notice.js';
import { openSheet } from '../../ui/sheet.js';

export function openPrivacyNotice() {
  openSheet(`
    <div class="sheet-h"><div><h3>${esc(NOTICE_TITLE)}</h3><span class="who">How Job Auto uses your personal information.</span></div><button class="x" data-close aria-label="Close">${
      ICON.x
    }</button></div>
    <div class="notice">${SECTIONS.map(([h, p]) => `<section><h4>${esc(h)}</h4><p>${esc(p)}</p></section>`).join('')}</div>
    <button class="btn primary wide" data-close>Close</button>`);
}
