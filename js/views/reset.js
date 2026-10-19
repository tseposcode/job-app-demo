// reset.js
// Choose a new password, opened from the link in the reset email (#reset/TOKEN).

import { $ } from '../lib/utils.js';
import { resetPassword } from '../services/auth.js';
import { showError } from '../ui/forms.js';

let token = '';
export const useResetToken = (t) => {
  token = t || '';
};

export function render() {
  if (!token) {
    return `<div class="hello"><h1>Reset link needed</h1><p class="muted">Open the link in your reset email, or ask for a new one.</p></div>
      <button class="btn primary wide" data-go="forgot">Ask for a new link</button>`;
  }
  return `<div class="hello"><h1>Choose a new password</h1><p class="muted">Use at least 6 characters.</p></div>
    <form class="card form" id="rsForm" novalidate>
      <label class="field"><span>New password</span><input type="password" id="rsPass" autocomplete="new-password" required></label>
      <label class="field"><span>Type it again</span><input type="password" id="rsPass2" autocomplete="new-password" required></label>
      <p class="err" id="rsErr" hidden></p>
      <button class="btn primary wide" type="submit">Save new password</button>
    </form>`;
}

export function bind(root, ctx) {
  $('#rsForm', root)?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = $('#rsPass', root).value;
    if (pass !== $('#rsPass2', root).value) return showError($('#rsErr', root), 'The two passwords are not the same.');
    const result = resetPassword(token, pass);
    if (!result.ok) return showError($('#rsErr', root), result.error);
    token = '';
    ctx.toast('Password changed. Log in with your new password.');
    ctx.go('login');
  });
}
