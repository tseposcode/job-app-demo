// access.js
// Where a logged-in person must go before they can use the app:
// 1. agree to the privacy notice, 2. finish setup (CV, details, preferences),
// 3. have an active plan. The router and the apply rules both ask here.

import { PRIVACY_VERSION } from '../config.js';
import { currentUser } from './auth.js';
import { hasActiveSubscription } from './subscription.js';

// Consent counts only if it was given to the current version of the notice.
export function hasConsent(u = currentUser()) {
  const c = u && u.consent;
  return !!(c && c.version === PRIVACY_VERSION && c.processing && c.sharing && c.adult);
}

// The sign-up page this person still has to finish, or null if they are done.
export function pendingStep(u = currentUser()) {
  if (!u) return null;
  if (!hasConsent(u)) return 'consent';
  if (!u.onboarded) return 'setup';
  if (!hasActiveSubscription(u)) return 'subscribe';
  return null;
}

// Applying (by hand or automatically) needs all three.
export const canApply = (u = currentUser()) => !!u && pendingStep(u) === null;
