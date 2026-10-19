// help.js
// Help and contact: common questions, how to reach us, and a message form.
// Open to everyone, logged in or not.

import { COMPANY, PRIVACY_CONTACT, SUPPORT_EMAIL } from '../config.js';
import { $, esc } from '../lib/utils.js';
import { currentUser } from '../services/auth.js';
import { sendMessage, TOPICS } from '../services/support.js';
import { showError } from '../ui/forms.js';
import { openLegal } from './sheets/legal.js';
import { openPrivacyNotice } from './sheets/privacy-notice.js';

const FAQ = [
  ['What does Job Auto do?', 'You upload your CV once and tell us what jobs you want. We match you with graduate and entry-level jobs, and auto-apply sends your CV and a short cover note to every strong match. Or switch to one-tap and choose each job yourself.'],
  ['How does auto-apply choose jobs?', 'Each job gets a match score from your field, qualification, skills, location and pay. Auto-apply sends your CV to jobs at your chosen score (75% unless you change it) in your provinces, or anywhere if you are willing to relocate. You can pause it any time.'],
  ['Why do some jobs say "Apply on their site"?', "Some employers only take applications on their own website. Auto-apply can't fill in other websites, so we link you there. Tap \"I applied there\" afterwards and we keep track for you."],
  ['What does the employer receive?', 'Your CV, a short cover note written for that job, and your contact details. Open any application and tap "See what the employer received" to see it exactly.'],
  ['How much does it cost?', 'Monthly R59, 3 months R149, or Yearly R499. Pay with Apple Pay, Samsung Pay, Google Pay, a card or Instant EFT.'],
  ['How do I cancel?', 'Profile → Plan → Cancel plan. You keep access until the end of the period you paid for. Within 7 days of buying, you can ask for a full refund.'],
  ['My payment failed. What now?', 'We email you and try again over 7 days. Update your card on your Profile and we try again straight away.'],
  ['Is my information safe?', 'We only share your CV with employers you apply to, and with companies that run the service for us. We never sell it. You can download or delete everything from your Profile.'],
  ['I forgot my password.', 'On the Log in page, tap "Forgot password?" and we email you a link to choose a new one.'],
];

let sent = null;

export function render() {
  const u = currentUser();
  return `<div class="hello"><h1>Help and contact</h1><p class="muted">Answers to common questions, and how to reach us.</p></div>
    <section class="section"><h2>Common questions</h2><div class="list faq">${FAQ.map(
      ([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`,
    ).join('')}</div></section>
    <section class="section"><h2>Contact us</h2><dl class="list">
      <div class="row"><dt>Email</dt><dd>${esc(SUPPORT_EMAIL)}</dd></div>
      <div class="row"><dt>Hours</dt><dd>Monday to Friday, 08:00 to 17:00</dd></div>
      <div class="row"><dt>Company</dt><dd>${esc(COMPANY)}</dd></div>
      <div class="row"><dt>Address</dt><dd class="muted">To be added before launch</dd></div>
      <div class="row"><dt>Information Officer</dt><dd>${esc(PRIVACY_CONTACT)} <span class="muted">(name to be added before launch)</span></dd></div>
    </dl></section>
    <section class="section"><h2>Send us a message</h2>${
      sent
        ? `<div class="status"><span class="dot"></span><div><strong>Message sent. Reference ${esc(sent.id)}.</strong><span>We usually reply within 2 working days, to ${esc(
            sent.email,
          )}.</span></div></div>`
        : `<form class="card form" id="hpForm" novalidate>
      <div class="grid2"><label class="field"><span>Name</span><input type="text" id="hpName" value="${esc(u ? u.name : '')}"></label>
      <label class="field"><span>Email</span><input type="email" id="hpEmail" value="${esc(u ? u.email : '')}"></label></div>
      <label class="field"><span>What is it about?</span><select id="hpTopic">${TOPICS.map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
      <label class="field"><span>Message</span><textarea id="hpMsg" rows="4"></textarea></label>
      <p class="err" id="hpErr" hidden></p>
      <button class="btn primary wide" type="submit">Send message</button></form>`
    }</section>
    <div class="list-actions"><button class="btn sm" id="hpTerms">Terms of Service</button><button class="btn sm" id="hpRefunds">Cancellation and refunds</button><button class="btn sm" id="hpPrivacy">Privacy notice</button></div>
    <button class="btn ghost" data-go="${u ? 'profile' : 'login'}">Back</button>`;
}

export function bind(root, ctx) {
  $('#hpForm', root)?.addEventListener('submit', (e) => {
    e.preventDefault();
    const result = sendMessage({
      name: $('#hpName', root).value,
      email: $('#hpEmail', root).value,
      topic: $('#hpTopic', root).value,
      message: $('#hpMsg', root).value,
    });
    if (!result.ok) return showError($('#hpErr', root), result.error);
    sent = result.ticket;
    ctx.refresh();
    setTimeout(() => {
      sent = null;
    }, 0);
  });
  $('#hpTerms', root).addEventListener('click', () => openLegal('terms'));
  $('#hpRefunds', root).addEventListener('click', () => openLegal('refunds'));
  $('#hpPrivacy', root).addEventListener('click', openPrivacyNotice);
}
