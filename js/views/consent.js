// consent.js
// Sign-up step 2: the POPIA privacy notice and consent tick boxes.
// Consent must be active (nothing pre-ticked), specific and informed. Marketing
// is a separate, optional box. Declining deletes the new account.

import { PRIVACY_VERSION } from '../config.js';
import { $, esc } from '../lib/utils.js';
import { SUMMARY } from '../data/privacy-notice.js';
import { currentUser } from '../services/auth.js';
import { deleteAccount, giveConsent } from '../services/account.js';
import { confirmInline, showError } from '../ui/forms.js';
import { accountLine, stepHeader } from '../ui/steps.js';
import { openPrivacyNotice } from './sheets/privacy-notice.js';

const tick = (id, text, required) =>
  `<label class="tick"><input type="checkbox" id="${id}"><span>${esc(text)} <em>${required ? 'Required' : 'Optional'}</em></span></label>`;

export function render() {
  const u = currentUser();
  const changed = u.consent && u.consent.version !== PRIVACY_VERSION;
  const intro = 'Before we read your CV, here is how Job Auto uses your information. Tick the boxes to agree.';
  const head = u.onboarded
    ? `<div class="hello"><h1>${changed ? 'Our privacy notice has changed' : 'Your privacy'}</h1><p class="muted">Please read it and agree again to keep using Job Auto.</p></div>`
    : stepHeader(2, 'Your privacy', intro);
  return `${head}
    <dl class="list">${SUMMARY.map(([h, p]) => `<div class="row"><dt>${esc(h)}</dt><dd>${esc(p)}</dd></div>`).join('')}</dl>
    <button class="btn ghost" type="button" id="readNotice">Read the full privacy notice</button>
    <form class="card form" id="consentForm" novalidate>
      ${tick('cProcess', 'I agree that Job Auto may use my personal information, including my CV, to match me with jobs.', true)}
      ${tick('cShare', 'I agree that Job Auto may send my CV and profile to employers when I apply, or when auto-apply applies for me.', true)}
      ${tick('cAdult', 'I am 18 or older.', true)}
      ${tick('cMarketing', 'Email me job tips and offers from Job Auto. I can stop these at any time.', false)}
      <p class="err" id="cErr" hidden></p>
      <button class="btn primary wide" type="submit">Agree and continue</button>
      <div id="declineBox"><button class="btn ghost wide" type="button" id="cDecline">I don't agree</button></div>
    </form>
    ${accountLine(u)}`;
}

export function bind(root, ctx) {
  $('#readNotice', root).addEventListener('click', openPrivacyNotice);

  $('#consentForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const required = ['#cProcess', '#cShare', '#cAdult'].every((id) => $(id, root).checked);
    if (!required) {
      return showError($('#cErr', root), 'Tick the three required boxes to continue. Without them we cannot match you or apply for you.');
    }
    giveConsent({ marketing: $('#cMarketing', root).checked });
    ctx.go('setup');
  });

  $('#cDecline', root).addEventListener('click', () => {
    confirmInline($('#declineBox', root), {
      message: 'Without your consent we cannot match you or apply for you, so we will delete your account and everything in it from this device.',
      yes: 'Delete my account',
      no: 'Go back',
      onYes: () => {
        deleteAccount();
        ctx.toast('Your account was deleted.');
        ctx.go('login');
      },
      onNo: ctx.refresh,
    });
  });
}
