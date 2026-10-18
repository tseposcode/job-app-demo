// subscription.js
// The paywall rules: who has an active plan, subscribing, cancelling, resuming.
// Test version: no money moves. A live version gets the "paid" signal from a
// payment provider's server, never from the browser.

import { PLANS } from '../config.js';
import { save } from '../core/store.js';
import { uid } from '../lib/utils.js';
import { currentUser } from './auth.js';

export const planById = (id) => PLANS.find((p) => p.id === id) || null;

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

export function subscribe(planId) {
  const u = currentUser();
  const plan = planById(planId);
  if (!u || !plan) return null;
  const now = Date.now();
  const ref = `TEST-${uid().toUpperCase()}`;
  u.subscription = {
    plan: plan.id,
    price: plan.price,
    status: 'active',
    startedAt: now,
    renewsAt: addMonths(now, plan.months),
    ref,
    payments: [{ at: now, amount: plan.price, ref, test: true }],
  };
  save();
  return u.subscription;
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
