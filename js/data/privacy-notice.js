// privacy-notice.js
// The words of the privacy notice (POPIA section 18) shown at sign-up and on Profile.
// DRAFT for the test version: a lawyer must check it before the app goes live.
// If you change what it says, bump PRIVACY_VERSION in config.js so everyone agrees again.

import { COMPANY, PRIVACY_CONTACT, PRIVACY_VERSION } from '../config.js';

export const NOTICE_TITLE = `Job Auto privacy notice (version ${PRIVACY_VERSION}, draft)`;

// The short version on the sign-up step.
export const SUMMARY = [
  ['Who we are', `Job Auto is a product of ${COMPANY}, the company responsible for your information.`],
  ['What we collect', 'Your account details, your CV and profile (education, skills, experience, where and what you want to work), the jobs you apply to and, if you subscribe, your payment and billing information.'],
  ['Why', 'To match you with jobs and to send your CV to employers when you apply, or when auto-apply applies for you.'],
  ['Who sees it', 'Only the employers you apply to, and the companies that host the app or take payments for us. We never sell your information.'],
  ['Your rights', 'See, fix, download or delete your information, and withdraw your consent, at any time from your profile.'],
];

// The full notice, opened from "Read the full privacy notice".
export const SECTIONS = [
  ['Who we are', `Job Auto is a job-matching service, still being tested, and a product of ${COMPANY} ("we"). ${COMPANY} is the responsible party for your personal information under POPIA: we decide why and how it is used. Our address and the name and contact details of our Information Officer will be added here before launch. Until then, write to ${PRIVACY_CONTACT}.`],
  ['What we collect', 'Account: name, surname, email and password (stored scrambled, never as plain text). CV and profile: phone number, town and province, qualifications, skills, experience, job preferences and a photo if you add one. Activity: the jobs you apply to, their status, the cover note sent with each application, and your settings. Messages: what you send us from the Help page, and a copy of the emails we send you.'],
  ['Payment and billing information', 'If you buy a Job Auto plan, you give us, or our payment provider, your payment information (for example your credit or debit card details) and your billing information (for example your name and billing address). Your card details are entered on a secure page run by our payment provider, which processes them for us under the card industry security standard (PCI DSS). We do not see or store your full card number. From the payment provider we receive and keep the plan you chose, its dates, the amount paid, a payment reference and limited card details, such as the card type, the last four digits and the expiry date, so we can run your plan, renew or cancel it, and handle refunds and disputes.'],
  ['What we do not need', 'We do not ask for your ID number, and we do not need information about your health, religion, race, union membership or criminal record. If your CV has these, think about taking them off before you upload it.'],
  ['Why we use it', 'To create your account; to match you with jobs; to send your CV and profile to employers when you apply or when auto-apply applies for you; to show you updates on your applications and email you about them; to answer your messages; to take payment for your plan, renew it and handle refunds; and to keep the service safe. With your separate permission only, to email you job tips and offers.'],
  ['Is it voluntary?', 'Yes. You choose what to give us. Without your CV and profile we cannot match you or apply for you.'],
  ['Who we share it with', 'Employers whose jobs you apply to, yourself or through auto-apply. Our payment provider, to process your payments. Companies that host the app, under contracts that require them to keep it safe. We do not sell or rent your information to anyone.'],
  ['Outside South Africa', 'Some of the companies that host data may store it outside South Africa. We will only use ones that give protection similar to POPIA, as section 72 requires. In this test version, everything stays on your own device.'],
  ['How long we keep it', 'While your account is open. When you delete your account, we delete your information, except records the law requires us to keep (for example payment records). In this test version, deleting removes everything from your device at once.'],
  ['How we protect it', 'We limit who can see your information, use secure connections, and will tell you and the Information Regulator if your information is ever accessed without permission.'],
  ['Your rights', 'You can ask what information we hold about you; correct it or delete it; download a copy; object to how we use it; withdraw your consent at any time (this does not undo what was done before); and stop marketing emails at any time. You can also complain to the Information Regulator: inforegulator.org.za.'],
  ['Age', 'Job Auto is for people aged 18 and older.'],
  ['Changes to this notice', 'If we change this notice, we will show you the new version and ask you to agree again before you carry on.'],
];
