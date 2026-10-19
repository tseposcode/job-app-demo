// terms.js
// Terms of Service and the Cancellation and refund policy.
// DRAFT for the test version: a lawyer must check both before the app goes live.
// When the wording changes, bump TERMS_VERSION.

import { COMPANY, PLANS, SUPPORT_EMAIL } from '../config.js';

export const TERMS_VERSION = '0.1';
const prices = PLANS.map((p) => `${p.name} R${p.price}`).join(', ');

export const LEGAL = {
  terms: {
    title: `Terms of Service (version ${TERMS_VERSION}, draft)`,
    intro: 'The agreement between you and us when you use Job Auto.',
    sections: [
      ['Who we are', `Job Auto is a service of ${COMPANY} ("we", "us"). By creating an account you agree to these terms. Our company registration number and address will be added here before launch.`],
      ['What Job Auto does', 'Job Auto matches you with graduate and entry-level jobs and, with your permission, sends your CV and a short cover note to employers for you (auto-apply), or lets you apply with one tap. We do not promise that any employer will reply, interview or hire you.'],
      ['Your account', 'You must be 18 or older. Give true information, keep your password private, and tell us straight away if someone else uses your account. One account per person.'],
      ['Your CV and details', 'You are responsible for what is in your CV and profile. Do not upload anything that is false, or information about other people without their permission. How we use your information is set out in the Privacy notice.'],
      ['Auto-apply', 'When auto-apply is on, you authorise us to send your CV and cover note to every job that matches your preferences at your chosen match level. You can pause it, change your preferences or withdraw an application at any time. Some employers only take applications on their own website; auto-apply skips those.'],
      ['Plans and payment', `Job Auto Premium is a paid subscription (${prices}, including any taxes). Card and wallet plans renew automatically at the end of each period and the price is charged to your payment method until you cancel. Instant EFT pays once and does not renew by itself. Payments are processed by our payment provider. If a renewal payment fails, we try again over 7 days; if it still fails, the plan ends.`],
      ['Price changes', 'If we change the price of your plan, we will tell you by email at least 30 days before it applies to you, and you can cancel before then.'],
      ['Cancelling', 'You can cancel any time on your Profile. You keep access until the end of the period you paid for. See the Cancellation and refund policy.'],
      ['Fair use', 'Do not misuse Job Auto: no fake accounts, no scraping, no attempts to break or overload the service, and no harassment of employers or other users. We may suspend accounts that break these terms, and will tell you why.'],
      ['Job listings', 'Listings come from employers and job sources we work with. We check them where we can, but we are not the employer and are not responsible for an employer\'s decisions. Report a listing that looks false and we will review it.'],
      ['Our liability', 'We provide Job Auto with reasonable care and skill. Nothing in these terms limits rights you have under the Consumer Protection Act or other law that cannot be limited.'],
      ['Changes to these terms', 'If we change these terms, we will show you the new version and tell you what changed before it applies to you.'],
      ['Contact and complaints', `Write to ${SUPPORT_EMAIL} or use the Help page. These terms are governed by the law of South Africa.`],
    ],
  },
  refunds: {
    title: 'Cancellation and refund policy (draft)',
    intro: 'How to cancel your plan and when you get money back.',
    sections: [
      ['Cancel any time', 'Go to Profile → Plan → Cancel plan. Your plan stops renewing straight away and you keep full access until the end of the period you already paid for. There is no cancellation fee.'],
      ['Changed your mind? 7 days', 'If you cancel within 7 days of buying a plan, we refund the full amount, as South African consumer law allows for buying online. Contact us from the Help page and we will refund it to the payment method you used.'],
      ['After 7 days', 'We do not refund part of a period you have already started, unless the law requires it or we could not provide the service. You keep access until the period ends.'],
      ['Renewals', 'We email you before a yearly plan renews. If you forgot to cancel and have not used Job Auto since the renewal, contact us within 7 days of the renewal and we will refund it.'],
      ['Failed payments', 'If a renewal payment fails, we email you and try again over 7 days. Update your card on your Profile to keep your plan. Nothing extra is charged for a failed payment.'],
      ['How long refunds take', 'Card and wallet refunds usually reach your account in 5 to 10 working days, depending on your bank. Instant EFT refunds are paid into your bank account.'],
      ['Contact', `Write to ${SUPPORT_EMAIL} or use the Help page, and include your payment reference (on your Profile under Billing history).`],
    ],
  },
};
