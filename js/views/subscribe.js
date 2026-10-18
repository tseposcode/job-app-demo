// subscribe.js
// Sign-up step 6, and the page anyone without an active plan lands on:
// choose a plan, then a TEST checkout. No card details are ever asked for here.
// A live version sends people to a payment provider's secure page instead.

import { PLANS } from '../config.js';
import { $, $$, esc, fmtDay, money } from '../lib/utils.js';
import { ICON } from '../lib/icons.js';
import { currentUser } from '../services/auth.js';
import { waitingMatches } from '../services/applications.js';
import { planById, subscribe } from '../services/subscription.js';
import { closeSheet, openSheet } from '../ui/sheet.js';
import { accountLine, stepHeader } from '../ui/steps.js';

let chosen = (PLANS.find((p) => p.best) || PLANS[0]).id;

const perText = (p) => (p.months === 1 ? 'per month' : `every ${p.months} months`);

const BENEFITS = [
  'Auto-apply sends your CV to every job that matches you',
  'Or review your matches and apply with one tap',
  'See when employers view your CV and invite you to interview',
  'Cancel any time on your profile',
];

export function render() {
  const u = currentUser();
  const n = waitingMatches().length;
  const head = u.subscription
    ? '<div class="hello"><h1>Your plan has ended</h1><p class="muted">Choose a plan to start applying again.</p></div>'
    : stepHeader(6, 'Choose your plan', 'Job Auto is a paid service. Pick a plan to start applying.');
  const teaser = n
    ? `<div class="status"><span class="dot"></span><div><strong>${n} ${n === 1 ? 'job matches' : 'jobs match'} you right now.</strong><span>${
        u.auto.mode === 'auto' ? 'Subscribe and auto-apply sends your CV to them straight away.' : 'Subscribe to apply to them with one tap.'
      }</span></div></div>`
    : '<div class="status off"><span class="dot"></span><div><strong>No strong matches yet.</strong><span>New jobs are added often. We start applying as soon as one fits.</span></div></div>';
  const plans = PLANS.map(
    (p) => `<button type="button" class="plan" role="radio" aria-checked="${p.id === chosen}" data-plan="${p.id}">
      ${p.best ? '<span class="best">Best value</span>' : ''}<strong>${esc(p.name)}</strong>
      <span class="price num">${money(p.price)}</span><span class="small muted">${perText(p)} · ${esc(p.note)}</span></button>`,
  ).join('');
  const plan = planById(chosen);
  return `${head}${teaser}
    <div class="plans" role="radiogroup" aria-label="Plans">${plans}</div>
    <ul class="why card">${BENEFITS.map((b) => `<li class="ok"><b aria-hidden="true">✓</b><span>${esc(b)}</span></li>`).join('')}</ul>
    <button class="btn primary wide" id="toPay">Continue with ${esc(plan.name)} · ${money(plan.price)}</button>
    <p class="small muted center">Test version: no real payment is taken.</p>
    ${accountLine(u)}`;
}

export function bind(root, ctx) {
  $$('[data-plan]', root).forEach((b) =>
    b.addEventListener('click', () => {
      chosen = b.dataset.plan;
      ctx.refresh();
    }),
  );
  $('#toPay', root).addEventListener('click', () => openCheckout(ctx));
}

function openCheckout(ctx) {
  const plan = planById(chosen);
  const renews = new Date();
  renews.setMonth(renews.getMonth() + plan.months);
  const root = openSheet(`
    <div class="sheet-h"><div><h3>Checkout</h3><span class="who">Job Auto · ${esc(plan.name)}</span></div><button class="x" data-close aria-label="Close">${
      ICON.x
    }</button></div>
    <div class="status warn"><span class="dot"></span><div><strong>Test mode</strong><span>No real payment is taken and no card details are asked for.</span></div></div>
    <dl class="list">
      <div class="row"><dt>Plan</dt><dd>${esc(plan.name)}</dd></div>
      <div class="row"><dt>Price</dt><dd class="num">${money(plan.price)} ${perText(plan)}</dd></div>
      <div class="row"><dt>Renews</dt><dd>${fmtDay(renews)}</dd></div>
      <div class="row"><dt>Cancel</dt><dd>Any time on your profile. You keep access until the end of the period you paid for.</dd></div>
    </dl>
    <p class="small muted">In the live app you pay on a secure page run by a payment provider. Job Auto never sees or stores your card number.</p>
    <button class="btn primary wide" id="payTest">Pay ${money(plan.price)} (test)</button>`);

  $('#payTest', root).addEventListener('click', () => {
    subscribe(plan.id);
    closeSheet();
    const sent = ctx.autoApply({ silent: true });
    ctx.go('jobs');
    ctx.toast(
      sent
        ? `You're subscribed. Auto-apply sent your CV to ${sent} ${sent === 1 ? 'job' : 'jobs'}.`
        : "You're subscribed. Welcome to Job Auto.",
    );
  });
}
