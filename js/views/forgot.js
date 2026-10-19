// forgot.js
// "Forgot password?": ask for a reset link by email. In the test version no real
// email goes out, so the page shows the link the email contains.

import { $ } from '../lib/utils.js';
import { requestPasswordReset } from '../services/auth.js';
import { showError } from '../ui/forms.js';
import { useResetToken } from './reset.js';

let sent = null; // { email, token } after asking

export function render() {
  if (sent) {
    return `<div class="hello"><h1>Check your email</h1><p class="muted">If an account exists for that address, we sent a link to reset the password. It works for 1 hour.</p></div>
      ${
        sent.token
          ? `<div class="status warn"><span class="dot"></span><div><strong>Test version: no real email is sent</strong><span>This is the link the email contains.</span></div><button class="btn sm" id="openReset">Open link</button></div>`
          : ''
      }
      <button class="btn wide" id="backLogin">Back to log in</button>`;
  }
  return `<div class="hello"><h1>Forgot your password?</h1><p class="muted">Enter the email you signed up with and we'll send you a link to choose a new one.</p></div>
    <form class="card form" id="fgForm" novalidate>
      <label class="field"><span>Email</span><input type="email" id="fgEmail" autocomplete="email" required></label>
      <p class="err" id="fgErr" hidden></p>
      <button class="btn primary wide" type="submit">Send reset link</button>
    </form>
    <p class="small muted center"><button class="linkbtn" data-go="login">Back to log in</button></p>`;
}

export function bind(root, ctx) {
  $('#fgForm', root)?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#fgEmail', root).value;
    const result = requestPasswordReset(email);
    if (!result.ok) return showError($('#fgErr', root), result.error);
    sent = { email, token: result.token };
    ctx.refresh();
  });
  $('#openReset', root)?.addEventListener('click', () => {
    useResetToken(sent.token);
    sent = null;
    ctx.go('reset');
  });
  $('#backLogin', root)?.addEventListener('click', () => {
    sent = null;
    ctx.go('login');
  });
}
