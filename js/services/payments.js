// payments.js
// Taking payment for a plan. Pages call pay() and never talk to a payment
// provider directly, so going live means adding one adapter here, not changing pages.
//
// Card numbers stop in this file: pay() returns only the brand, last four digits
// and expiry. In test mode only the test cards below are accepted, so a real card
// typed in by mistake is refused and never kept.
//
// LIVE: the browser asks our server to start a payment; the server talks to the
// provider with its secret key; card details go into the provider's own secure
// fields or page (so they never touch our code); and the plan is only marked as
// paid when the provider tells our server (a "webhook"), never by the browser.

import { PAYMENT_PROVIDER } from '../config.js';
import { uid } from '../lib/utils.js';

export const WALLETS = {
  apple_pay: { label: 'Apple Pay', confirm: 'Confirm with Face ID', card: { brand: 'Visa', last4: '0019' } },
  samsung_pay: { label: 'Samsung Pay', confirm: 'Verify with fingerprint', card: { brand: 'Mastercard', last4: '4444' } },
  google_pay: { label: 'Google Pay', confirm: 'Continue', card: { brand: 'Visa', last4: '1881' } },
};

// The phone's own wallet first: Apple Pay on iPhones, Samsung Pay on Samsung, Google Pay on other Android.
export function walletOrder({ ua = '', applePay = false } = {}) {
  const first = applePay || /iPhone|iPad|Macintosh/.test(ua)
    ? 'apple_pay'
    : /SamsungBrowser|SM-[A-Z]\d/.test(ua)
      ? 'samsung_pay'
      : /Android/.test(ua)
        ? 'google_pay'
        : null;
  const all = Object.keys(WALLETS);
  return first ? [first, ...all.filter((w) => w !== first)] : all;
}

// ---------- card checks ----------

export const digits = (s) => String(s || '').replace(/\D/g, '');

export function cardBrand(number) {
  const n = digits(number);
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  if (/^3(0[0-5]|[689])/.test(n)) return 'Diners Club';
  return '';
}

const LENGTHS = { Visa: [13, 16, 19], Mastercard: [16], 'American Express': [15], 'Diners Club': [14, 16] };

// "4242424242424242" -> "4242 4242 4242 4242"; American Express is 4-6-5.
export function formatCardNumber(value) {
  const n = digits(value).slice(0, 19);
  const groups = cardBrand(n) === 'American Express' ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const out = [];
  let i = 0;
  for (const g of groups) {
    if (i >= n.length) break;
    out.push(n.slice(i, i + g));
    i += g;
  }
  return out.join(' ');
}

// "1228" -> "12 / 28"
export function formatExpiry(value) {
  const n = digits(value).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)} / ${n.slice(2)}` : n;
}

// The standard check digit test every card number passes (Luhn).
function luhn(n) {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = +n[n.length - 1 - i];
    if (i % 2) d = d * 2 > 9 ? d * 2 - 9 : d * 2;
    sum += d;
  }
  return sum % 10 === 0;
}

// Returns an error message, or '' if the card details look right.
export function checkCard({ number, expiry, cvc, name }, now = new Date()) {
  const n = digits(number);
  const brand = cardBrand(n);
  if (!n) return 'Enter your card number.';
  if (!brand) return 'We accept Visa, Mastercard, American Express and Diners Club.';
  if (!LENGTHS[brand].includes(n.length) || !luhn(n)) return 'Check your card number.';
  const e = digits(expiry);
  const month = +e.slice(0, 2);
  const year = 2000 + +e.slice(2, 4);
  if (e.length !== 4 || month < 1 || month > 12) return 'Enter the expiry date as MM / YY.';
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return 'This card has expired.';
  if (digits(cvc).length !== (brand === 'American Express' ? 4 : 3)) return `Enter the ${brand === 'American Express' ? '4' : '3'}-digit security code.`;
  if (!String(name || '').trim()) return 'Enter the name on the card.';
  return '';
}

// ---------- how a payment method is shown ----------

export function methodLabel(m) {
  if (!m) return '';
  if (m.type === 'card') return `${m.brand} •••• ${m.last4}`;
  if (m.type === 'wallet') return `${m.label} (${m.brand} •••• ${m.last4})`;
  if (m.type === 'eft') return `Instant EFT · ${m.bank}`;
  return '';
}

// ---------- test provider ----------

// Test cards, like the ones payment providers publish for testing. Any future expiry and any CVC.
export const TEST_CARDS = {
  '4242424242424242': 'ok',
  '5555555555554444': 'ok',
  '378282246310005': 'ok',
  '4000000000000002': 'declined',
  '4000000000009995': 'no_funds',
  '4000002760003184': 'approve', // asks the person to approve in their banking app (3-D Secure)
};
export const TEST_CARD = { number: '4242 4242 4242 4242', expiry: '12 / 30', cvc: '123' };

const FAIL = {
  declined: 'Your bank declined this card. Try another card or payment method.',
  no_funds: 'There is not enough money on this card. Try another card or payment method.',
  not_test: 'Test mode: real cards are never charged here. Tap "Use a test card".',
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const reference = () => `JA-${Date.now().toString(36).toUpperCase()}-${uid().slice(0, 4).toUpperCase()}`;

const testProvider = {
  name: 'Test payments',
  live: false,
  // method: { type: 'card', card } | { type: 'wallet', wallet } | { type: 'eft', bank }
  async pay({ amount, method }) {
    await wait(700);
    if (method.type === 'wallet') {
      const w = WALLETS[method.wallet];
      return { ok: true, ref: reference(), amount, method: { type: 'wallet', wallet: method.wallet, label: w.label, ...w.card } };
    }
    if (method.type === 'eft') {
      return { ok: true, ref: reference(), amount, method: { type: 'eft', bank: method.bank } };
    }
    const n = digits(method.card.number);
    const saved = { type: 'card', brand: cardBrand(n), last4: n.slice(-4), expiry: formatExpiry(method.card.expiry) };
    const result = TEST_CARDS[n];
    if (!result) return { ok: false, error: FAIL.not_test };
    if (result === 'approve') return { ok: false, approve: true, ref: reference(), amount, method: saved };
    if (result !== 'ok') return { ok: false, error: FAIL[result] };
    return { ok: true, ref: reference(), amount, method: saved };
  },
  // Saving a new card on the plan, without charging it.
  async saveCard(card) {
    await wait(500);
    const n = digits(card.number);
    if (!TEST_CARDS[n]) return { ok: false, error: FAIL.not_test };
    if (TEST_CARDS[n] === 'declined') return { ok: false, error: FAIL.declined };
    return { ok: true, method: { type: 'card', brand: cardBrand(n), last4: n.slice(-4), expiry: formatExpiry(card.expiry) } };
  },
};

const PROVIDERS = { test: testProvider };
const provider = () => PROVIDERS[PAYMENT_PROVIDER] || testProvider;

export const isTestMode = () => !provider().live;
export const pay = (args) => provider().pay(args);
export const saveCard = (card) => provider().saveCard(card);
