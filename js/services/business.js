// business.js
// Numbers for the admin dashboard: subscribers, monthly income and payments.
// LIVE: the payment provider's dashboard is the official record; these are a quick view.

import { getState } from '../core/store.js';
import { now } from '../core/clock.js';
import { hasActiveSubscription, planById } from './subscription.js';

export function allPayments() {
  const out = [];
  for (const u of Object.values(getState().users)) {
    for (const p of (u.subscription && u.subscription.payments) || []) out.push({ ...p, email: u.email, name: `${u.name} ${u.surname}` });
  }
  return out.sort((a, b) => b.at - a.at);
}

export function businessNumbers() {
  const users = Object.values(getState().users);
  const subs = users.map((u) => u.subscription).filter(Boolean);
  const active = users.filter((u) => hasActiveSubscription(u));
  // Monthly recurring revenue: what renewing plans bring in per month on average.
  const mrr = active
    .map((u) => u.subscription)
    .filter((s) => s.status === 'active' && s.autoRenew !== false)
    .reduce((sum, s) => sum + s.price / ((planById(s.plan) || { months: 1 }).months || 1), 0);
  const t = new Date(now());
  const monthStart = new Date(t.getFullYear(), t.getMonth(), 1).getTime();
  const pays = allPayments();
  const kept = (p) => !p.refundedAt;
  const plans = {};
  active.forEach((u) => {
    plans[u.subscription.plan] = (plans[u.subscription.plan] || 0) + 1;
  });
  return {
    subscribers: active.length,
    mrr: Math.round(mrr),
    thisMonth: pays.filter((p) => kept(p) && p.at >= monthStart && p.at <= now()).reduce((s, p) => s + p.amount, 0),
    total: pays.filter(kept).reduce((s, p) => s + p.amount, 0),
    refunded: pays.filter((p) => p.refundedAt).reduce((s, p) => s + p.amount, 0),
    pastDue: subs.filter((s) => s.status === 'past_due').length,
    cancelled: subs.filter((s) => s.status === 'cancelled').length,
    ended: subs.filter((s) => ['ended', 'refunded'].includes(s.status)).length,
    plans,
  };
}
