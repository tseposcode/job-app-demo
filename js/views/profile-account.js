// profile-account.js
// The "Plan", "Billing history" and "Privacy" sections at the bottom of the Profile page:
// cancel or keep the plan, marketing emails on or off, read the privacy notice,
// download my data, withdraw consent and delete the account (POPIA rights).

import { $, esc, fmtDay, money } from '../lib/utils.js';
import { cancelSubscription, perText, planById, resumeSubscription, setPaymentMethod } from '../services/subscription.js';
import { cardExpiresAt, methodLabel } from '../services/payments.js';
import { retryNow } from '../services/billing.js';
import { openChangeCard } from './sheets/checkout.js';
import { deleteAccount, exportMyData, setMarketing } from '../services/account.js';
import { confirmInline } from '../ui/forms.js';
import { openPrivacyNotice } from './sheets/privacy-notice.js';
import { openLegal } from './sheets/legal.js';

const row = (label, value) => `<div class="row"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`;

function planSection(u) {
  const sub = u.subscription;
  if (!sub) return '';
  const plan = planById(sub.plan);
  const per = plan ? perText(plan) : 'per month';
  const active = sub.status === 'active';
  const pastDue = sub.status === 'past_due';
  const renewText = pastDue ? 'Payment due' : !active ? 'Ends' : sub.autoRenew === false ? 'Plan ends' : 'Next payment';
  const failed = pastDue
    ? `<div class="status bad"><span class="dot"></span><div><strong>Your last payment didn't go through</strong><span>Update your card to keep your plan. We try again every 2 days; without payment your plan ends on ${fmtDay(
        sub.graceUntil,
      )}.</span></div></div>`
    : '';
  const expiring =
    active && sub.autoRenew !== false && sub.method && sub.method.type === 'card' && cardExpiresAt(sub.method.expiry) <= sub.renewsAt
      ? `<div class="status warn"><span class="dot"></span><div><strong>Your card expires before your next payment</strong><span>Update it so your plan carries on.</span></div></div>`
      : '';
  const method = sub.method
    ? `<div class="row"><dt>Payment method</dt><dd><span>${esc(methodLabel(sub.method))}${
        sub.method.expiry ? `<span class="muted small"> · expires ${esc(sub.method.expiry)}</span>` : ''
      }</span> <button class="linkbtn small" id="chCard">${sub.method.type === 'card' ? 'Change' : 'Use a card'}</button></dd></div>`
    : '';
  const history = (sub.payments || [])
    .slice()
    .reverse()
    .map(
      (p) => `<li class="bill"><div><strong class="num">${money(p.amount)}${p.refundedAt ? ' <span class="state rejected">Refunded</span>' : ''}</strong><span class="muted small">${fmtDay(p.at)} · ${esc(
        methodLabel(p.method) || 'Payment',
      )}</span></div><span class="muted small">${esc(p.ref)}${p.test ? ' · test' : ''}</span></li>`,
    )
    .join('');
  return `<section class="section"><h2>Plan</h2>${failed}${expiring}<dl class="list">
    ${row('Plan', `Job Auto Premium · ${plan ? plan.name : sub.plan} · ${money(sub.price)} ${per}`)}
    ${row(renewText, fmtDay(pastDue ? sub.failedAt : sub.renewsAt))}
    ${method}
    ${active && sub.autoRenew === false ? '<p class="small muted pad">Instant EFT pays once. Add a card to renew by itself, or pay again before your plan ends.</p>' : ''}
    <div class="list-actions" id="subBox">${
      active || pastDue
        ? '<button class="btn sm danger" id="subCancel">Cancel plan</button>'
        : '<button class="btn sm primary" id="subResume">Keep my plan</button>'
    }</div>
  </dl></section>
  ${history ? `<section class="section"><h2>Billing history</h2><ul class="list bills">${history}</ul></section>` : ''}`;
}

function privacySection(u) {
  const c = u.consent || {};
  return `<section class="section"><h2>Privacy</h2><div class="list">
    <dl>${row('Consent', c.at ? `Given ${fmtDay(c.at)} to notice version ${c.version}` : 'Not given')}</dl>
    <div class="setting"><div><strong>Job tips by email</strong><span>Optional. Turn off any time.</span></div><button class="switch" id="mktSw" role="switch" aria-checked="${!!c.marketing}" aria-label="Job tips by email"></button></div>
    <div class="list-actions"><button class="btn sm" id="privNotice">Privacy notice</button><button class="btn sm" id="dlData">Download my data</button></div>
    <div class="list-actions"><button class="btn sm" id="legTerms">Terms of Service</button><button class="btn sm" id="legRefunds">Cancellation and refunds</button><button class="btn sm" data-go="help">Help and contact</button></div>
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

  $('#chCard', root)?.addEventListener('click', () =>
    openChangeCard({
      user: u,
      onSaved: (method) => {
        setPaymentMethod(method);
        const retry = retryNow(u);
        if (retry) ctx.toast(retry.ok ? `Payment received from ${methodLabel(method)}. Your plan carries on.` : `${methodLabel(method)} saved, but the payment failed: ${retry.error}`);
        else ctx.toast(`${methodLabel(method)} will be used for your next payments.`);
        ctx.refresh();
      },
    }),
  );

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
  $('#legTerms', root).addEventListener('click', () => openLegal('terms'));
  $('#legRefunds', root).addEventListener('click', () => openLegal('refunds'));

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
