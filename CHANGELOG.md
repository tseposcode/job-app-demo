# Changelog

Notable changes a user or tester would notice. Newest first.

## 0.3.1 (2026-10-18)

- Plan page: three tiles (Monthly R60, 3 months R150, Yearly R699) with price per month, savings and a "Best value" badge.
- Phones now load fresh styles after an update instead of mixing old and new files.

## 0.3.0 (2026-10-18)

- New six-step sign-up: account, privacy, CV, details, preferences, plan.
- POPIA privacy step: plain-language summary, full notice, required consent boxes (nothing pre-ticked), separate optional marketing box, 18+ check. Consent is stored with the notice version and time.
- The app reads PDF CVs in the browser and fills in the profile. Three made-up sample CVs to try it with.
- Paywall: a plan is needed to apply. Test checkout only; no card details and no money.
- Profile: plan (cancel or keep), marketing on or off, privacy notice, download my data, withdraw consent and delete account.
- Admin: subscriber count and each account's consent record.

## 0.2.0 (2026-10-18)

- Split the app into separate files by job (styles, pages, rules, data). Behaviour is the same.
- Typing a page name after `#` in the address (for example `#admin`) now opens that page.
- Added automatic tests, linting and formatting settings, and guides for contributors.

## 0.1.0 (2026-10-16)

- First test version: accounts, profile and CV upload, 20 sample jobs with match scores, automatic or one-tap apply, simulated employer replies, PIN-protected admin.
