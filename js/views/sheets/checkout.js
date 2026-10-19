// checkout.js
// The checkout panel, laid out like big subscription apps (LinkedIn Premium):
// order summary, express wallets (Apple Pay, Samsung Pay, Google Pay), then card
// or Instant EFT, a clear "you will be charged" line, and a receipt at the end.
// All payment work happens in services/payments.js; this file only draws.

import { CARD_BRANDS, COMPANY, EFT_BANKS } from '../../config.js';
import { $, $$, esc, fmtDay, money } from '../../lib/utils.js';
import { ICON } from '../../lib/icons.js';
import {
  cardBrand,
  checkCard,
  formatCardNumber,
  formatExpiry,
  isTestMode,
  methodLabel,
  pay,
  saveCard,
  TEST_CARD,
  walletOrder,
  WALLETS,
} from '../../services/payments.js';
import { perText } from '../../services/subscription.js';
import { LEGAL } from '../../data/terms.js';
import { closeSheet, openSheet } from '../../ui/sheet.js';

const LOCK =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

const BRAND_SHORT = { Visa: 'VISA', Mastercard: 'Mastercard', 'American Express': 'AMEX', 'Diners Club': 'Diners' };

const addMonths = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
};

const testBanner = () =>
  isTestMode()
    ? '<div class="status warn"><span class="dot"></span><div><strong>Test mode: no money moves</strong><span>Use a test card or any wallet. Real cards are refused.</span></div></div>'
    : '';

const secureLine = () =>
  `<p class="secure small muted">${LOCK}<span>Payments are processed securely by our payment provider. Job Auto never sees your full card number.</span></p>`;

const cardFields = () => `
  <div class="brands" aria-label="Cards we accept">${CARD_BRANDS.map((b) => `<span class="brand-chip">${esc(BRAND_SHORT[b])}</span>`).join('')}</div>
  <label class="field"><span>Card number</span>
    <span class="card-in"><input type="text" id="ccNum" inputmode="numeric" autocomplete="cc-number" placeholder="1234 1234 1234 1234"><b id="ccBrand" class="brand-chip" hidden></b></span></label>
  <div class="grid2">
    <label class="field"><span>Expiry date</span><input type="text" id="ccExp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY"></label>
    <label class="field"><span>Security code</span><input type="text" id="ccCvc" inputmode="numeric" autocomplete="cc-csc" placeholder="CVC" maxlength="4"></label>
  </div>
  <label class="field"><span>Name on card</span><input type="text" id="ccName" autocomplete="cc-name"></label>
  ${isTestMode() ? '<button type="button" class="linkbtn small" id="ccTest">Use a test card</button>' : ''}`;

function bindCardFields(root, u) {
  const num = $('#ccNum', root);
  const brand = $('#ccBrand', root);
  const showBrand = () => {
    const b = cardBrand(num.value);
    brand.hidden = !b;
    brand.textContent = BRAND_SHORT[b] || '';
  };
  num.addEventListener('input', () => {
    num.value = formatCardNumber(num.value);
    showBrand();
  });
  const exp = $('#ccExp', root);
  exp.addEventListener('input', (e) => {
    if (e.inputType !== 'deleteContentBackward') exp.value = formatExpiry(exp.value);
  });
  $('#ccTest', root)?.addEventListener('click', () => {
    num.value = TEST_CARD.number;
    exp.value = TEST_CARD.expiry;
    $('#ccCvc', root).value = TEST_CARD.cvc;
    if (!$('#ccName', root).value) $('#ccName', root).value = `${u.name || ''} ${u.surname || ''}`.trim();
    showBrand();
  });
}

const readCard = (root) => ({
  number: $('#ccNum', root).value,
  expiry: $('#ccExp', root).value,
  cvc: $('#ccCvc', root).value,
  name: $('#ccName', root).value,
});

// ---------- checkout ----------

// onPaid(payment) saves the plan; onDone() runs when the person taps "Start applying".
export function openCheckout({ plan, user, onPaid, onDone }) {
  let tab = 'card';
  const renews = addMonths(plan.months);
  const root = openSheet(`
    <div class="sheet-h"><div><h3>Checkout</h3><span class="who">Job Auto Premium · ${esc(plan.name)}</span></div><button class="x" data-close aria-label="Close">${ICON.x}</button></div>
    <div id="co"></div>`);
  const box = $('#co', root);

  const terms = () =>
    tab === 'eft'
      ? `By tapping Pay, you agree that ${esc(COMPANY)} charges ${money(plan.price)} once. Instant EFT does not renew by itself: your plan ends on ${fmtDay(renews)} unless you pay again.`
      : `By tapping Pay, you agree that ${esc(COMPANY)} charges ${money(plan.price)} today and ${money(plan.price)} ${perText(plan)} after that until you cancel. Cancel any time on your Profile; you keep access until the end of the period you paid for.`;

  function drawForm(error = '') {
    const wallets = walletOrder({ ua: navigator.userAgent, applePay: !!window.ApplePaySession });
    box.innerHTML = `${testBanner()}
      <section class="card co-sum">
        <div class="co-line"><span><strong>Job Auto Premium</strong><span class="muted small">${esc(plan.name)} plan</span></span><span class="num">${money(plan.price)}</span></div>
        <div class="co-line small muted"><span>Billed</span><span>${tab === 'eft' ? 'Once' : `${perText(plan)}, from today`}</span></div>
        <div class="co-line small muted"><span>${tab === 'eft' ? 'Plan ends' : 'Next payment'}</span><span>${fmtDay(renews)}</span></div>
        <div class="co-line co-total"><span>Total due today</span><span class="num">${money(plan.price)}</span></div>
        <p class="small muted">Prices in South African rand (ZAR).</p>
      </section>
      <section class="co-sec"><h4>Express checkout</h4>
        <div class="wallets">${wallets.map((w) => `<button type="button" class="wallet" data-wallet="${w}">${esc(WALLETS[w].label)}</button>`).join('')}</div>
      </section>
      <div class="or"><span>or pay another way</span></div>
      <div class="seg wide" role="group" aria-label="Payment method">
        <button type="button" data-tab="card" aria-pressed="${tab === 'card'}">Card</button><button type="button" data-tab="eft" aria-pressed="${tab === 'eft'}">Instant EFT</button>
      </div>
      <form class="form co-form" id="coForm" novalidate>
        ${
          tab === 'card'
            ? cardFields()
            : `<label class="field"><span>Your bank</span><select id="eftBank"><option value="">Choose your bank</option>${EFT_BANKS.map((b) => `<option>${esc(b)}</option>`).join('')}</select></label>
               <p class="small muted">You approve the payment in your banking app. Instant EFT pays once and does not renew by itself.</p>`
        }
        <p class="err" id="coErr"${error ? '' : ' hidden'}>${esc(error)}</p>
        <p class="small muted">${terms()} See the <button type="button" class="linkbtn" id="coTerms">Terms of Service</button> and <button type="button" class="linkbtn" id="coRefunds">Cancellation and refund policy</button>.</p>
        <button class="btn primary wide" type="submit" id="coPay">Pay ${money(plan.price)}</button>
      </form>
      ${secureLine()}`;

    $$('[data-tab]', box).forEach((b) =>
      b.addEventListener('click', () => {
        tab = b.dataset.tab;
        drawForm();
      }),
    );
    $$('[data-wallet]', box).forEach((b) => b.addEventListener('click', () => drawWallet(b.dataset.wallet)));
    // Opening a legal text replaces this panel, so reopen checkout when it closes.
    $('#coTerms', box).addEventListener('click', () => showLegal('terms'));
    $('#coRefunds', box).addEventListener('click', () => showLegal('refunds'));
    if (tab === 'card') bindCardFields(box, user);
    $('#coForm', box).addEventListener('submit', (e) => {
      e.preventDefault();
      if (tab === 'eft') {
        const bank = $('#eftBank', box).value;
        if (!bank) return showErr('Choose your bank.');
        return run({ type: 'eft', bank });
      }
      const card = readCard(box);
      const problem = checkCard(card);
      if (problem) return showErr(problem);
      run({ type: 'card', card });
    });
  }

  function showLegal(kind) {
    const doc = LEGAL[kind];
    box.innerHTML = `<div class="notice">${doc.sections.map(([h, p]) => `<section><h4>${esc(h)}</h4><p>${esc(p)}</p></section>`).join('')}</div>
      <button class="btn primary wide" id="legalBack">Back to checkout</button>`;
    $('#legalBack', box).addEventListener('click', () => drawForm());
  }

  const showErr = (text) => {
    const err = $('#coErr', box);
    err.textContent = text;
    err.hidden = !text;
  };

  // A wallet shows its own confirm panel on the phone; this stands in for it.
  function drawWallet(id) {
    const w = WALLETS[id];
    box.innerHTML = `${testBanner()}
      <section class="card wallet-sheet">
        <div class="co-line"><strong>${esc(w.label)}</strong><button type="button" class="linkbtn" id="wBack">Cancel</button></div>
        <div class="co-line small"><span class="muted">Pay</span><span>${esc(COMPANY)} (Job Auto)</span></div>
        <div class="co-line small"><span class="muted">Card</span><span>${esc(w.card.brand)} •••• ${esc(w.card.last4)}${isTestMode() ? ' (test)' : ''}</span></div>
        <div class="co-line small"><span class="muted">Then</span><span>${money(plan.price)} ${perText(plan)} until you cancel</span></div>
        <div class="co-line co-total"><span>Pay now</span><span class="num">${money(plan.price)}</span></div>
        <button class="btn wallet wide" id="wPay">${esc(w.confirm)}</button>
      </section>`;
    $('#wBack', box).addEventListener('click', () => drawForm());
    $('#wPay', box).addEventListener('click', () => run({ type: 'wallet', wallet: id }));
  }

  function drawBusy(text) {
    box.innerHTML = `<div class="co-busy" role="status"><span class="spinner" aria-hidden="true"></span><strong>${esc(text)}</strong><span class="small muted">Don't close this page.</span></div>`;
  }

  // 3-D Secure: some banks ask you to approve card payments in their app.
  function drawApprove(result) {
    box.innerHTML = `<div class="co-busy"><span class="spinner" aria-hidden="true"></span><strong>Approve the payment in your banking app</strong>
      <span class="small muted">Your bank sent a request to approve ${money(plan.price)} to ${esc(COMPANY)}.</span>
      <button class="btn primary wide" id="apYes">I approved it${isTestMode() ? ' (test)' : ''}</button><button class="btn wide" id="apNo">Cancel</button></div>`;
    $('#apYes', box).addEventListener('click', async () => {
      drawBusy('Confirming with your bank...');
      await new Promise((r) => setTimeout(r, 600));
      done({ ok: true, ref: result.ref, amount: result.amount, method: result.method });
    });
    $('#apNo', box).addEventListener('click', () => drawForm('You cancelled the payment. Nothing was charged.'));
  }

  async function run(method) {
    drawBusy(method.type === 'eft' ? `Waiting for ${method.bank}...` : 'Processing payment...');
    const result = await pay({ amount: plan.price, method });
    if (result.approve) return drawApprove(result);
    if (!result.ok) return drawForm(result.error);
    done(result);
  }

  function done(payment) {
    const sub = onPaid(payment);
    box.innerHTML = `<div class="co-done">
        <span class="co-tick" aria-hidden="true">${ICON.check}</span>
        <h3>Payment successful</h3>
        <p class="muted">Welcome to Job Auto Premium.</p>
      </div>
      <dl class="list receipt">
        <div class="row"><dt>Amount</dt><dd class="num">${money(payment.amount)}</dd></div>
        <div class="row"><dt>Paid with</dt><dd>${esc(methodLabel(payment.method))}</dd></div>
        <div class="row"><dt>Plan</dt><dd>${esc(plan.name)}</dd></div>
        <div class="row"><dt>Date</dt><dd>${fmtDay(Date.now())}</dd></div>
        <div class="row"><dt>${sub.autoRenew ? 'Next payment' : 'Plan ends'}</dt><dd>${fmtDay(sub.renewsAt)}</dd></div>
        <div class="row"><dt>Reference</dt><dd>${esc(payment.ref)}${sub.test ? ' (test)' : ''}</dd></div>
      </dl>
      <p class="small muted">A copy of this receipt is on your Profile under Billing history.</p>
      <button class="btn primary wide" id="coDone">Start applying</button>`;
    $('#coDone', box).addEventListener('click', () => {
      closeSheet();
      onDone();
    });
  }

  drawForm();
}

// ---------- change card (Profile) ----------

export function openChangeCard({ user, onSaved }) {
  const root = openSheet(`
    <div class="sheet-h"><div><h3>Payment method</h3><span class="who">Used for your next payments. Nothing is charged now.</span></div><button class="x" data-close aria-label="Close">${ICON.x}</button></div>
    ${testBanner()}
    <form class="form co-form" id="ccForm" novalidate>${cardFields()}<p class="err" id="ccErr" hidden></p>
      <button class="btn primary wide" type="submit">Save card</button></form>
    ${secureLine()}`);
  bindCardFields(root, user);
  const err = $('#ccErr', root);
  $('#ccForm', root).addEventListener('submit', async (e) => {
    e.preventDefault();
    const card = readCard(root);
    const problem = checkCard(card);
    err.hidden = !problem;
    err.textContent = problem;
    if (problem) return;
    const btn = $('#ccForm button[type=submit]', root);
    btn.disabled = true;
    btn.textContent = 'Saving...';
    const result = await saveCard(card);
    if (!result.ok) {
      btn.disabled = false;
      btn.textContent = 'Save card';
      err.hidden = false;
      err.textContent = result.error;
      return;
    }
    closeSheet();
    onSaved(result.method);
  });
}
