// subscription.js
// The paywall rules: who has an active plan, subscribing, cancelling, resuming.
// Payment itself happens in payments.js. A live version gets the "paid" signal
// from the payment provider's server, never from the browser.

import { PLANS } from '../config.js';
import { save } from '../core/store.js';
import { currentUser } from './auth.js';
import { isTestMode, methodLabel } from './payments.js';
import { now } from '../core/clock.js';
import { fmtDay, money } from '../lib/utils.js';
import { notify } from './notify.js';

export const planById = (id) => PLANS.find((p) => p.id === id) || null;

// "per month", "every 3 months", "per year"
export const perText = (plan) =>
  plan.months === 1 ? 'per month' : plan.months === 12 ? 'per year' : `every ${plan.months} months`;

// What one month costs on this plan, and how much it saves against paying monthly.
export function planValue(plan) {
  const monthly = PLANS.find((p) => p.months === 1) || plan;
  return {
    perMonth: plan.price / plan.months,
    saving: Math.max(0, Math.round(monthly.price * plan.months - plan.price)),
  };
}

// The plan with the lowest price per month gets the "Best value" badge.
export const bestPlanId = () =>
  PLANS.reduce((best, p) => (planValue(p).perMonth < planValue(best).perMonth ? p : best), PLANS[0]).id;

export const addMonths = (t, months) => {
  const d = new Date(t);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
};

// Statuses: active, past_due (a renewal failed; we retry during a 7-day grace period),
// cancelled (access until the paid period ends), ended, refunded.
// Renewals themselves happen in billing.js.
export function hasActiveSubscription(u = currentUser()) {
  const sub = u && u.subscription;
  if (!sub) return false;
  const t = now();
  if (sub.status === 'active') return sub.autoRenew !== false || t < sub.renewsAt;
  if (sub.status === 'past_due') return t < sub.graceUntil;
  if (sub.status === 'cancelled') return t < sub.renewsAt;
  return false;
}

// payment = what pay() in payments.js returned: { ref, amount, method }.
// Instant EFT pays once, so that plan does not renew by itself.
export function subscribe(planId, payment) {
  const u = currentUser();
  const plan = planById(planId);
  if (!u || !plan || !payment) return null;
  const at = now();
  const earlier = (u.subscription && u.subscription.payments) || [];
  u.subscription = {
    plan: plan.id,
    price: plan.price,
    status: 'active',
    startedAt: at,
    renewsAt: addMonths(at, plan.months),
    autoRenew: payment.method.type !== 'eft',
    method: payment.method,
    ref: payment.ref,
    test: isTestMode(),
    payments: [...earlier, { at, amount: payment.amount, ref: payment.ref, method: payment.method, plan: plan.id, test: isTestMode() }],
  };
  save();
  const sub = u.subscription;
  notify(u.email, {
    kind: 'receipt',
    subject: `Your Job Auto receipt (${payment.ref})`,
    lines: [
      `Hi ${u.name},`,
      `Thanks for subscribing to Job Auto Premium (${plan.name}). We received ${money(payment.amount)} from ${methodLabel(payment.method)}.`,
      sub.autoRenew
        ? `Your plan renews on ${fmtDay(sub.renewsAt)} at ${money(plan.price)}. Cancel any time on your Profile.`
        : `Instant EFT pays once, so your plan ends on ${fmtDay(sub.renewsAt)} unless you pay again.`,
      `Reference: ${payment.ref}${sub.test ? ' (test, no money moved)' : ''}.`,
    ],
    action: { label: 'Start applying', kind: 'jobs' },
  });
  return sub;
}

// A new card for the next payments. Nothing is charged now.
export function setPaymentMethod(method) {
  const u = currentUser();
  if (!u || !u.subscription) return;
  u.subscription.method = method;
  u.subscription.autoRenew = method.type !== 'eft';
  delete u.subscription.warnedExpiry;
  save();
  notify(u.email, {
    kind: 'billing',
    subject: 'Your payment method was updated',
    lines: [`Hi ${u.name},`, `From now on your plan is paid with ${methodLabel(method)}.`, 'If you did not make this change, contact support straight away.'],
  });
}

// Cancelling keeps access until the end of the period already paid for.
export function cancelSubscription() {
  const u = currentUser();
  if (!u || !u.subscription) return;
  u.subscription.status = 'cancelled';
  u.subscription.cancelledAt = now();
  save();
  notify(u.email, {
    kind: 'billing',
    subject: 'Your plan is cancelled',
    lines: [
      `Hi ${u.name},`,
      `Your Job Auto Premium plan will not renew. You keep full access until ${fmtDay(u.subscription.renewsAt)}.`,
      'Changed your mind? Tap "Keep my plan" on your Profile before then.',
      'Cancelled within 7 days of buying? You can ask for a full refund from the Help page.',
    ],
  });
}

export function resumeSubscription() {
  const u = currentUser();
  if (!u || !u.subscription) return;
  u.subscription.status = 'active';
  delete u.subscription.cancelledAt;
  save();
}
