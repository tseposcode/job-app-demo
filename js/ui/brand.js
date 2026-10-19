// brand.js
// The Gentle-TT mark (flower, hands and "Gentle TT") with the company line.
// Shown at the very bottom of Log in, Create an account and Profile (see BRAND_PAGES in router.js).
// The mark is drawn in the app's gold (--gold), so it suits light and dark mode.

import { COMPANY } from '../config.js';
import { esc } from '../lib/utils.js';

export function madeBy(id = '') {
  return `<div class="madeby"><span class="brandmark" role="img" aria-label="Gentle TT logo"></span><p class="small muted"${
    id ? ` id="${id}"` : ''
  }>Job Auto is a product of ${esc(COMPANY)}.</p></div>`;
}
