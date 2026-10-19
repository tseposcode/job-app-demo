// legal.js (sheet)
// Shows the Terms of Service or the Cancellation and refund policy.

import { esc } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import { LEGAL } from '../../data/terms.js';
import { openSheet } from '../../ui/sheet.js';

// kind: 'terms' or 'refunds'
export function openLegal(kind) {
  const doc = LEGAL[kind];
  openSheet(`
    <div class="sheet-h"><div><h3>${esc(doc.title)}</h3><span class="who">${esc(doc.intro)}</span></div><button class="x" data-close aria-label="Close">${ICON.x}</button></div>
    <div class="notice">${doc.sections.map(([h, p]) => `<section><h4>${esc(h)}</h4><p>${esc(p)}</p></section>`).join('')}</div>
    <button class="btn primary wide" data-close>Close</button>`);
}
