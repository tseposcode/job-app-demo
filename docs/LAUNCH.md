# Going live: what is left

The test version is built so that launching means **connecting real services at
a few plug-in points**, not rebuilding screens. Each plug-in point is one file
with a "LIVE:" comment explaining what to add.

## Plug-in points in the code

| What | File | Setting in `js/config.js` | Today (test) | Live |
|---|---|---|---|---|
| Data and accounts | `js/core/backend.js` | `BACKEND` | Saved in this browser | Our server: accounts, hashed passwords, private CV storage |
| Job listings | `js/services/job-source.js` | `JOB_SOURCE` | 20 made-up jobs | Job feeds read by our server, in the same job shape (incl. `apply`) |
| Payments | `js/services/payments.js` | `PAYMENT_PROVIDER` | Test cards only, no money moves | Payment provider: hosted card fields, Apple Pay / Samsung Pay / Google Pay, Instant EFT, webhooks |
| Renewals and reminders | `js/services/billing.js` | – | Runs in the browser, test clock on Admin | Same rules on the server, on a schedule |
| Emails | `js/services/notify.js` | `MAIL_FROM` | In-app Inbox | Transactional email service (Inbox keeps a copy) |
| Help messages | `js/services/support.js` | `SUPPORT_EMAIL` | Listed on Admin | Support inbox or helpdesk |

## Business and legal tasks (only Gentle-TT can do these)

- [ ] Open a merchant account with a South African payment provider for Gentle-TT (Pty) Ltd (business verification, bank account).
- [ ] Get the official Apple Pay, Samsung Pay, Google Pay, Visa and Mastercard logos from the provider's brand kit, and set up Apple Pay domain verification.
- [ ] Register a domain, set up hosting for the server, and email sending (SPF/DKIM) from that domain.
- [ ] Agree terms with job-listing sources; confirm whether auto-apply is allowed for each.
- [ ] Have a lawyer check the Privacy notice, Terms of Service and Cancellation and refund policy.
- [ ] Add the company address, registration number and Information Officer (and register them with the Information Regulator).
- [ ] Confirm plan prices, and whether VAT applies.
- [ ] Decide how support is answered (who, which hours).
