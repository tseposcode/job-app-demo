// steps.js
// Pieces shared by the sign-up pages: the "Step 3 of 6" header and bar,
// and the "Signed in as ... Log out" line (the router wires [data-logout]).

import { SIGNUP_STEPS } from '../config.js';
import { esc } from '../lib/utils.js';

export function stepHeader(step, title, intro = '') {
  const bars = Array.from({ length: SIGNUP_STEPS }, (_, i) => `<i class="${i < step ? 'done' : ''}"></i>`).join('');
  return `<div class="hello">
    <p class="step-n">Step ${step} of ${SIGNUP_STEPS}</p>
    <div class="steps" aria-hidden="true">${bars}</div>
    <h1>${esc(title)}</h1>${intro ? `<p class="muted">${esc(intro)}</p>` : ''}
  </div>`;
}

export const accountLine = (u) =>
  `<p class="small muted center">Signed in as ${esc(u.email)} · <button class="linkbtn" type="button" data-logout>Log out</button></p>`;
