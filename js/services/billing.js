// billing.js
// What happens to a plan over time: renewing, failed payments, reminders and
// ending. Uses the test clock (core/clock.js) so the admin can jump ahead.
//
// LIVE: this runs on the server on a schedule (and the payment provider's
// webhooks), not in the browser. The rules stay the same.

import { DAY } from '../config.js';
import { getState, save } from '../core/store.js';
import { now } from '../core/clock.js';
import { fmtDay, money } from '../lib/utils.js';
import { cardExpiresAt, chargeSaved, methodLabel } from './payments.js';
import { notify } from './notify.js';
import { addMonths, planById } from './subscription.js';

const GRACE = 7 * DAY; // how long access continues after a failed renewal
const RETRY_EVERY = 2 * DAY;
const REMIND_BEFORE = 7 * DAY;

function mail(u, subject, lines, action) {
  notify(u.email, { kind: 'billing', subject, lines: [`Hi ${u.name},`, ...lines], action });
}

function takePayment(u, sub, plan, at) {
  const result = chargeSaved(sub.method, plan.price, at);
  if (!result.ok) return result;
  sub.payments.push({ at, amount: plan.price, ref: result.ref, method: sub.method, plan: plan.id, test: sub.test, kind: 'renewal' });
  return result;
}

function renewed(u, sub, plan, result) {
  mail(u, `Your Job Auto receipt (${result.ref})`, [
    `Your Job Auto Premium plan (${plan.name}) renewed. We received ${money(plan.price)} from ${methodLabel(sub.method)}.`,
    `Next payment: ${fmtDay(sub.renewsAt)}. Cancel any time on your Profile.`,
    `Reference: ${result.ref}${sub.test ? ' (test, no money moved)' : ''}.`,
  ]);
}

function ended(u, sub, at, why) {
  sub.status = 'ended';
  sub.endedAt = at;
  mail(u, 'Your Job Auto plan has ended', [why, 'Auto-apply has stopped. Choose a plan any time to start applying again.'], {
    label: 'Choose a plan',
    kind: 'subscribe',
  });
}

// Bring one person's plan up to date with the clock. Returns what happened.
export function runBilling(u, t = now()) {
  const sub = u && u.subscription;
  const done = { renewed: 0, failed: 0, ended: 0 };
  if (!sub || !['active', 'past_due', 'cancelled'].includes(sub.status)) return done;
  const plan = planById(sub.plan);
  if (!plan) return done;
  sub.payments = sub.payments || [];
  const autoRenew = sub.autoRenew !== false;

  // Reminders before the renewal or end date.
  if (sub.status === 'active' && t >= sub.renewsAt - REMIND_BEFORE && t < sub.renewsAt && sub.remindedFor !== sub.renewsAt) {
    sub.remindedFor = sub.renewsAt;
    if (!autoRenew) {
      mail(u, 'Your plan ends soon', [`Instant EFT pays once, so your plan ends on ${fmtDay(sub.renewsAt)}.`, 'Pay again or add a card on your Profile to keep applying.'], {
        label: 'Go to my plan',
        kind: 'profile',
      });
    } else if (plan.months >= 3) {
      mail(u, 'Your plan renews soon', [`Your ${plan.name} plan renews on ${fmtDay(sub.renewsAt)} at ${money(plan.price)}, paid with ${methodLabel(sub.method)}.`, 'Nothing to do if you want to keep it. To stop it, cancel on your Profile before then.']);
    }
  }

  // A saved card that will have expired by the next payment.
  if (sub.status === 'active' && autoRenew && sub.method && sub.method.type === 'card') {
    const key = `${sub.method.last4}${sub.method.expiry}`;
    if (cardExpiresAt(sub.method.expiry) <= sub.renewsAt && t >= sub.renewsAt - 30 * DAY && sub.warnedExpiry !== key) {
      sub.warnedExpiry = key;
      mail(u, 'Your card expires before your next payment', [`${methodLabel(sub.method)} expires ${sub.method.expiry}, before your next payment on ${fmtDay(sub.renewsAt)}.`, 'Update your card on your Profile so your plan carries on.'], {
        label: 'Update my card',
        kind: 'profile',
      });
    }
  }

  // Due dates that have passed (a long jump on the test clock can pass several).
  while (sub.status === 'active' && t >= sub.renewsAt) {
    if (!autoRenew) {
      ended(u, sub, sub.renewsAt, 'Your Instant EFT payment covered your plan until today.');
      done.ended++;
      break;
    }
    const due = sub.renewsAt;
    const result = takePayment(u, sub, plan, due);
    if (result.ok) {
      sub.renewsAt = addMonths(due, plan.months);
      renewed(u, sub, plan, result);
      done.renewed++;
    } else {
      Object.assign(sub, { status: 'past_due', failedAt: due, graceUntil: due + GRACE, nextRetry: due + RETRY_EVERY, retries: 0 });
      mail(u, 'We could not take your payment', [
        `Your ${plan.name} plan was due for renewal, but the payment of ${money(plan.price)} from ${methodLabel(sub.method)} did not go through (${result.error}).`,
        `You keep access while we try again over the next 7 days. Update your card to fix it now. If it still fails, your plan ends on ${fmtDay(sub.graceUntil)}.`,
      ], { label: 'Update my card', kind: 'profile' });
      done.failed++;
    }
  }

  // Retries during the grace period, then the end.
  while (sub.status === 'past_due' && t >= sub.nextRetry && sub.nextRetry < sub.graceUntil) {
    const result = takePayment(u, sub, plan, sub.nextRetry);
    if (result.ok) {
      recovered(u, sub, plan, result);
      done.renewed++;
      break;
    }
    sub.retries++;
    sub.nextRetry += RETRY_EVERY;
  }
  if (sub.status === 'past_due' && t >= sub.graceUntil) {
    ended(u, sub, sub.graceUntil, 'We could not take your renewal payment, so your plan ended.');
    done.ended++;
  }

  if (sub.status === 'cancelled' && t >= sub.renewsAt) {
    ended(u, sub, sub.renewsAt, 'You cancelled your plan, and the period you paid for is over.');
    done.ended++;
  }
  save();
  return done;
}

function recovered(u, sub, plan, result) {
  sub.status = 'active';
  sub.renewsAt = addMonths(sub.failedAt, plan.months);
  ['failedAt', 'graceUntil', 'nextRetry', 'retries'].forEach((k) => delete sub[k]);
  renewed(u, sub, plan, result);
}

// After the person updates their card during the grace period: try again straight away.
export function retryNow(u) {
  const sub = u && u.subscription;
  if (!sub || sub.status !== 'past_due') return null;
  const plan = planById(sub.plan);
  const result = takePayment(u, sub, plan, now());
  if (result.ok) recovered(u, sub, plan, result);
  save();
  return result;
}

// Everyone's plans, for the admin's test clock.
export function runBillingForAll(t = now()) {
  const total = { renewed: 0, failed: 0, ended: 0 };
  for (const u of Object.values(getState().users)) {
    const r = runBilling(u, t);
    Object.keys(total).forEach((k) => (total[k] += r[k]));
  }
  return total;
}

// ---------- refunds (admin) ----------

// Refund one payment. Refunding the payment for the current period ends the plan now.
export function refundPayment(email, ref) {
  const u = getState().users[email];
  const sub = u && u.subscription;
  const p = sub && sub.payments.find((x) => x.ref === ref);
  if (!p || p.refundedAt) return false;
  p.refundedAt = now();
  const latest = sub.payments[sub.payments.length - 1] === p;
  if (latest && ['active', 'past_due', 'cancelled'].includes(sub.status)) {
    sub.status = 'refunded';
    sub.endedAt = p.refundedAt;
  }
  save();
  mail(u, `Refund of ${money(p.amount)} (${p.ref})`, [
    `We refunded ${money(p.amount)} to ${methodLabel(p.method)}. Card refunds usually reach your account in 5 to 10 working days.`,
    latest ? 'Your plan has ended. Choose a plan any time to start applying again.' : 'Your current plan is not affected.',
    `Reference: ${p.ref}.`,
  ]);
  return true;
}
