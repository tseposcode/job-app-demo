// subscription.js
// The paywall rules: who has an active plan, subscribing, cancelling, resuming.
// Payment itself happens in payments.js. A live version gets the "paid" signal
// from the payment provider's server, never from the browser.

import { PLANS } from '../config.js';
import { save } from '../core/store.js';
import { currentUser } from './auth.js';
import { isTestMode } from './payments.js';

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

const addMonths = (t, months) => {
  const d = new Date(t);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
};

// Active = paid and not cancelled, or cancelled but the paid period has not ended.
export function hasActiveSubscription(u = currentUser()) {
  const sub = u && u.subscription;
  if (!sub) return false;
  if (sub.status === 'active') return true;
  return sub.status === 'cancelled' && Date.now() < sub.renewsAt;
}

// payment = what pay() in payments.js returned: { ref, amount, method }.
// Instant EFT pays once, so that plan does not renew by itself.
export function subscribe(planId, payment) {
  const u = currentUser();
  const plan = planById(planId);
  if (!u || !plan || !payment) return null;
  const now = Date.now();
  u.subscription = {
    plan: plan.id,
    price: plan.price,
    status: 'active',
    startedAt: now,
    renewsAt: addMonths(now, plan.months),
    autoRenew: payment.method.type !== 'eft',
    method: payment.method,
    ref: payment.ref,
    test: isTestMode(),
    payments: [{ at: now, amount: payment.amount, ref: payment.ref, method: payment.method, plan: plan.id, test: isTestMode() }],
  };
  save();
  return u.subscription;
}

// A new card for the next payments. Nothing is charged now.
export function setPaymentMethod(method) {
  const u = currentUser();
  if (!u || !u.subscription) return;
  u.subscription.method = method;
  u.subscription.autoRenew = method.type !== 'eft';
  save();
}

// Cancelling keeps access until the end of the period already paid for.
export function cancelSubscription() {
  const u = currentUser();
  if (!u || !u.subscription) return;
  u.subscription.status = 'cancelled';
  u.subscription.cancelledAt = Date.now();
  save();
}

export function resumeSubscription() {
  const u = currentUser();
  if (!u || !u.subscription) return;
  u.subscription.status = 'active';
  delete u.subscription.cancelledAt;
  save();
}
