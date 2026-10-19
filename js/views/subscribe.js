// subscribe.js
// Sign-up step 6, and the page anyone without an active plan lands on:
// choose a plan, then the checkout (views/sheets/checkout.js).

import { PLANS } from '../config.js';
import { $, $$, esc, money } from '../lib/utils.js';
import { currentUser } from '../services/auth.js';
import { waitingMatches } from '../services/applications.js';
import { bestPlanId, perText, planById, planValue, subscribe } from '../services/subscription.js';
import { openCheckout } from './sheets/checkout.js';
import { accountLine, stepHeader } from '../ui/steps.js';

let chosen = bestPlanId();

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
  const best = bestPlanId();
  const plans = PLANS.map((p) => {
    const v = planValue(p);
    const sub = p.months === 1 ? 'Cancel any time' : `${money(Math.round(v.perMonth))} a month`;
    return `<button type="button" class="plan" role="radio" aria-checked="${p.id === chosen}" data-plan="${p.id}">
      <span class="plan-top">${p.id === best ? '<span class="best">Best value</span>' : ''}<span class="radio" aria-hidden="true"></span></span>
      <strong>${esc(p.name)}</strong>
      <span class="price num">${money(p.price)}</span>
      <span class="per">${perText(p)}</span>
      <span class="plan-sub num">${sub}</span>
      ${v.saving ? `<span class="save num">Save ${money(v.saving)}</span>` : ''}
    </button>`;
  }).join('');
  const plan = planById(chosen);
  return `${head}${teaser}
    <div class="plans" role="radiogroup" aria-label="Plans">${plans}</div>
    <ul class="why card">${BENEFITS.map((b) => `<li class="ok"><b aria-hidden="true">✓</b><span>${esc(b)}</span></li>`).join('')}</ul>
    <button class="btn primary wide" id="toPay">Continue with ${esc(plan.name)} · ${money(plan.price)}</button>
    <p class="small muted center">Pay with Apple Pay, Samsung Pay, Google Pay, card or Instant EFT. Cancel any time.</p>
    ${accountLine(u)}`;
}

export function bind(root, ctx) {
  $$('[data-plan]', root).forEach((b) =>
    b.addEventListener('click', () => {
      chosen = b.dataset.plan;
      ctx.refresh();
    }),
  );
  $('#toPay', root).addEventListener('click', () => startCheckout(ctx));
}

function startCheckout(ctx) {
  openCheckout({
    plan: planById(chosen),
    user: currentUser(),
    onPaid: (payment) => subscribe(chosen, payment),
    onDone: () => {
      const sent = ctx.autoApply({ silent: true });
      ctx.go('jobs');
      ctx.toast(sent ? `Auto-apply sent your CV to ${sent} ${sent === 1 ? 'job' : 'jobs'}.` : 'Welcome to Job Auto Premium.');
    },
  });
}
