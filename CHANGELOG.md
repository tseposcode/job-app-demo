# Changelog

Notable changes a user or tester would notice. Newest first.

## 0.7.0 (2026-10-19)

- Gentle-TT branding: the Gentle TT logo (flower, hands and name) now sits at the very bottom of Log in, Create an account and Profile, under the test-version note, with "Job Auto is a product of Gentle-TT (Pty) Ltd." beneath it. It is drawn in the app's gold, so it suits light and dark mode.

## 0.6.3 (2026-10-19)

- Fixed: on iPhones (Safari) CVs could not be read after the first one, for PDF and Word files alike. The app now reads a CV before saving it on the phone, and saves a copy rather than the picked file.
- If a CV still can't be read, the message now ends with a short error code to help us find the cause.

## 0.6.2 (2026-10-19)

- Company name written the standard way: Gentle-TT (Pty) Ltd (Profile and privacy notice). Spelling only, so nobody is asked to agree again.

## 0.6.1 (2026-10-19)

- Privacy notice version 1.1: names Gentle-TT Pty Ltd as the company responsible for users' information (POPIA). Existing accounts are asked to agree again; the made-up test account accepts it by itself.

## 0.6.0 (2026-10-19)

- New logo: a simple briefcase on a green tile, in place of the checkmark. Also used for the browser tab and the phone home-screen icon.
- Profile now ends with "Job Auto is a product of Gentle-TT Pty Ltd."

## 0.5.0 (2026-10-18)

- The CV reader now handles real-world CVs, not just the sample layout: any heading style, labelled personal details, tables, bullet lists and two-column (Canva-style) PDFs.
- Word (.docx) CVs are read too. Old .doc files and scanned CVs get a clear message.
- When a CV doesn't say what jobs the person wants, preferences are suggested from their studies, skills and town, and the screen says so.
- Recognises South African towns and townships, province short forms (KZN, GP), qualifications (BCom, National Diploma, NSC...) and skips qualifications still in progress.
- Warns when a CV shows an ID number, race, religion, health or criminal record details. These are never saved.
- Three new made-up sample CVs in real-world styles, including a Word file.

## 0.4.0 (2026-10-18)

- "Willing to relocate": a switch on Profile and a tick box in preferences. When on, auto-apply also sends to good jobs outside your provinces (they score a little lower than jobs in your provinces).
- The Jobs page now says when good jobs are skipped only because of where they are, with a button to include them.
- A CV that says the person is willing or ready to relocate ticks the box during sign-up.
- New plan prices: R59 a month, R149 for 3 months, R499 a year.

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
