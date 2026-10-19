// signup.js
// The create-account page.

import { $ } from '../lib/utils.js';
import { signup } from '../services/auth.js';
import { showError } from '../ui/forms.js';
import { stepHeader } from '../ui/steps.js';
import { openLegal } from './sheets/legal.js';

export function render() {
  return `
    ${stepHeader(1, 'Create an account', 'Six short steps: account, privacy, CV, details, preferences and plan.')}
    <form class="card form" id="signupForm" novalidate>
      <div class="grid2">
        <label class="field"><span>Name</span><input type="text" id="suName" autocomplete="given-name" required></label>
        <label class="field"><span>Surname</span><input type="text" id="suSurname" autocomplete="family-name" required></label>
      </div>
      <label class="field"><span>Email</span><input type="email" id="suEmail" autocomplete="email" required></label>
      <label class="field"><span>Password (at least 6 characters)</span><input type="password" id="suPass" autocomplete="new-password" required></label>
      <p class="err" id="suErr" hidden></p>
      <p class="small muted">By creating an account, you agree to our <button type="button" class="linkbtn" id="suTerms">Terms of Service</button>. Next, we explain how we use your information.</p>
      <button class="btn primary wide" type="submit">Create account</button>
    </form>
    <p class="small muted" style="text-align:center">Already have an account? <button class="linkbtn" data-go="login">Log in</button></p>`;
}

export function bind(root, ctx) {
  $('#suTerms', root).addEventListener('click', () => openLegal('terms'));
  $('#signupForm', root).addEventListener('submit', (e) => {
    e.preventDefault();
    const result = signup({
      name: $('#suName', root).value.trim(),
      surname: $('#suSurname', root).value.trim(),
      email: $('#suEmail', root).value,
      password: $('#suPass', root).value,
    });
    if (!result.ok) return showError($('#suErr', root), result.error);
    ctx.go('consent');
  });
}
