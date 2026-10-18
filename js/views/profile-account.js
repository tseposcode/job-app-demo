// profile-account.js
// The "Plan" and "Privacy" sections at the bottom of the Profile page:
// cancel or keep the plan, marketing emails on or off, read the privacy notice,
// download my data, withdraw consent and delete the account (POPIA rights).

import { $, esc, fmtDay, money } from '../lib/utils.js';
import { cancelSubscription, perText, planById, resumeSubscription } from '../services/subscription.js';
import { deleteAccount, exportMyData, setMarketing } from '../services/account.js';
import { confirmInline } from '../ui/forms.js';
import { openPrivacyNotice } from './sheets/privacy-notice.js';

const row = (label, value) => `<div class="row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;

function planSection(u) {
  const sub = u.subscription;
  if (!sub) return '';
  const plan = planById(sub.plan);
  const per = plan ? perText(plan) : 'per month';
  const active = sub.status === 'active';
  return `<section class="section"><h2>Plan</h2><dl class="list">
    ${row('Plan', `${plan ? plan.name : sub.plan} · ${money(sub.price)} ${per}`)}
    ${row(active ? 'Renews' : 'Ends', fmtDay(sub.renewsAt))}
    ${row('Reference', `${sub.ref} (test, no money taken)`)}
    <div class="list-actions" id="subBox">${
      active
        ? '<button class="btn sm danger" id="subCancel">Cancel plan</button>'
        : '<button class="btn sm primary" id="subResume">Keep my plan</button>'
    }</div>
  </dl></section>`;
}

function privacySection(u) {
  const c = u.consent || {};
  return `<section class="section"><h2>Privacy</h2><div class="list">
    <dl>${row('Consent', c.at ? `Given ${fmtDay(c.at)} to notice version ${c.version}` : 'Not given')}</dl>
    <div class="setting"><div><strong>Job tips by email</strong><span>Optional. Turn off any time.</span></div><button class="switch" id="mktSw" role="switch" aria-checked="${!!c.marketing}" aria-label="Job tips by email"></button></div>
    <div class="list-actions"><button class="btn sm" id="privNotice">Privacy notice</button><button class="btn sm" id="dlData">Download my data</button></div>
    <div class="list-actions" id="delBox"><button class="btn sm danger" id="delAcct">Withdraw consent and delete account</button></div>
  </div></section>`;
}

export const renderAccountSections = (u) => planSection(u) + privacySection(u);

export function bindAccountSections(root, ctx, u) {
  $('#subCancel', root)?.addEventListener('click', () => {
    confirmInline($('#subBox', root), {
      message: `Cancel your plan? You keep access until ${fmtDay(u.subscription.renewsAt)}. After that, applying stops.`,
      yes: 'Cancel plan',
      no: 'Keep it',
      onYes: () => {
        cancelSubscription();
        ctx.toast(`Plan cancelled. You have access until ${fmtDay(u.subscription.renewsAt)}.`);
        ctx.refresh();
      },
      onNo: ctx.refresh,
    });
  });

  $('#subResume', root)?.addEventListener('click', () => {
    resumeSubscription();
    ctx.toast('Your plan will carry on.');
    ctx.refresh();
  });

  $('#mktSw', root).addEventListener('click', () => {
    const on = !(u.consent && u.consent.marketing);
    setMarketing(on);
    ctx.toast(on ? 'Job tips by email are on.' : 'Job tips by email are off.');
    ctx.refresh();
  });

  $('#privNotice', root).addEventListener('click', openPrivacyNotice);

  $('#dlData', root).addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(exportMyData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'job-auto-my-data.json' });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    ctx.toast('Your data was downloaded.');
  });

  $('#delAcct', root).addEventListener('click', () => {
    confirmInline($('#delBox', root), {
      message:
        'Withdraw your consent and delete your account? Your profile, CV and applications are deleted from this device. This cannot be undone.',
      yes: 'Delete everything',
      no: 'Keep my account',
      onYes: () => {
        deleteAccount();
        ctx.toast('Your account and information were deleted.');
        ctx.go('login');
      },
      onNo: ctx.refresh,
    });
  });
}
