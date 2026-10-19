// login.js
// The log-in page.

import { TEST_EMAIL, TEST_PASS } from '../config.js';
import { $ } from '../lib/utils.js';
import { login } from '../services/auth.js';
import { madeBy } from '../ui/brand.js';
import { showError } from '../ui/forms.js';

export function render() {
  return `
    <div class="hello"><h1>Log in</h1><p class="muted">Find graduate jobs and let Job Auto apply for you.</p></div>
    <form class="card form" id="loginForm" novalidate>
      <label class="field"><span>Email</span><input type="email" id="liEmail" autocomplete="username" required></label>
      <label class="field"><span>Password</span><input type="password" id="liPass" autocomplete="current-password" required></label>
      <p class="err" id="liErr" hidden></p>
      <button class="btn primary wide" type="submit">Log in</button>
      <button class="btn ghost wide" type="button" id="fillTest">Use the test account</button>
    </form>
    <p class="small muted" style="text-align:center">New here? <button class="linkbtn" data-go="signup">Create an account</button> · <button class="linkbtn" data-go="admin">Admin</button></p>
    ${madeBy()}`;
}

export function bind(root, ctx) {
  $('#fillTest', root).addEventListener('click', () => {
    $('#liEmail', root).value = TEST_EMAIL;
    $('#liPass', root).value = TEST_PASS;
  });
  $('#loginForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const result = login($('#liEmail', root).value, $('#liPass', root).value);
    if (!result.ok) return showError($('#liErr', root), result.error);
    ctx.go('jobs');
    ctx.autoApply();
  });
}
