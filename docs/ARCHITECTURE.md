# How Job Auto is put together

Job Auto is a browser-only web app. There is no server yet: accounts, jobs, applications and CVs are saved in the browser of the device using it. The code is split so that each file has **one job**, and you can fix one part without touching the rest.

## The layers

Code only calls **downwards** in this list. A page may use a service; a service never draws on the screen.

| Layer | Folder | Its job | Knows about the screen? |
|---|---|---|---|
| Start-up | `js/main.js` | Loads data, wires the tab bar, starts the timer | Yes |
| Router | `js/core/router.js` | Picks which page shows; tab bar and badge | Yes |
| Pages | `js/views/*.js` | Draw one page and handle its buttons | Yes |
| Sheets | `js/views/sheets/*.js` | The slide-up panels (job details, edit forms) | Yes |
| Shared UI | `js/ui/*.js` | Toast, sheet, form helpers used by many pages | Yes |
| Services | `js/services/*.js` | The rules: log in, match jobs, apply, auto-apply | **No** |
| Core | `js/core/store.js`, `js/core/files.js` | Saving data and CV files in the browser | No |
| Data | `js/data/*.js` | Sample jobs, the test account, the privacy notice text | No |
| Third-party | `js/vendor/pdfjs/` | pdf.js, for reading PDF CVs. Don't edit; replace the whole folder to update | No |
| Helpers | `js/lib/*.js`, `js/config.js` | Formatting, icons, fixed lists and settings | No |
| Styles | `css/*.css` | Colours (`tokens.css`), basics, shared pieces, page-only styles | — |

## "Something is wrong with X. Where do I look?"

| Problem | Open this file |
|---|---|
| Colours or fonts | `css/tokens.css` |
| The logo | `img/logo.svg` (tab icon), the `<svg class="logo">` in `index.html` (header), `img/*.png` (phone icons), `manifest.webmanifest` |
| The company name on Profile | `js/config.js` → `COMPANY` |
| A button, card, pill or the tab bar looks wrong everywhere | `css/components.css` |
| Something only looks wrong on Profile or Admin | `css/views.css` |
| Log in or sign up fails | `js/services/auth.js` (rules), `js/views/login.js` / `signup.js` (page) |
| Match score is wrong or the "Why this match" text | `js/services/matching.js` |
| Auto-apply sends to the wrong jobs | `js/services/applications.js` → `runAutoApply()` |
| Location rules: provinces, remote, "Willing to relocate" | `js/services/matching.js` → `match()` (the location part) |
| The "more jobs fit you outside your provinces" card | `js/views/jobs.js` → `relocateCard()`, `js/services/applications.js` → `relocationMatches()` |
| Statuses (Sent / Viewed / Interview) behave oddly | `js/services/applications.js` → `makeApplication()`, `statusOf()` |
| Search, filters or sorting on the Jobs page | `js/views/jobs.js` |
| Applied page list or filter chips | `js/views/applied.js` |
| CV upload or photo upload on Profile | `js/views/profile.js` → `setupProfileUploads()`, `js/services/cv.js`, `js/core/files.js` |
| CV details read wrongly (phone, town, qualification, skills...) | `js/services/cv-reader.js` → `parseCv()` and the `read...()` function for that detail |
| The reader doesn't know a town, skill, or field word | `js/data/cv-words.js` (just add it to the list) |
| A PDF CV comes out jumbled (two columns mixed up) | `js/lib/pdf-text.js` → `columnEdge()` |
| A Word CV can't be read | `js/lib/docx-text.js` |
| A CV can't be read at all, or the message shown | `js/services/cv.js` → `readCv()` |
| Sign-up steps: CV, details, preferences | `js/views/setup.js` |
| Privacy step, consent boxes | `js/views/consent.js` (page), `js/services/account.js` (recording consent) |
| Privacy notice wording | `js/data/privacy-notice.js` (then bump `PRIVACY_VERSION` in `js/config.js`) |
| Plan page or checkout | `js/views/subscribe.js` (page), `js/services/subscription.js` (rules) |
| Checkout screens: wallets, card form, Instant EFT, receipt, change card | `js/views/sheets/checkout.js` |
| Taking payment, test cards, card checks, going live with a payment provider | `js/services/payments.js` (provider adapters), `js/config.js` → `PAYMENT_PROVIDER` |
| Payment method and Billing history on Profile | `js/views/profile-account.js` |
| Plan prices | `js/config.js` → `PLANS` |
| Someone is sent to the wrong sign-up step | `js/services/access.js` → `pendingStep()`, used by `js/core/router.js` |
| Plan and Privacy sections on Profile; download my data; delete account | `js/views/profile-account.js`, `js/services/account.js` |
| Job details sheet, Apply or Withdraw button | `js/views/sheets/job-detail.js` |
| Edit profile form | `js/views/sheets/profile-edit.js` |
| Admin PIN, add/edit/delete jobs, reset | `js/views/admin.js`, `js/views/sheets/job-edit.js` |
| The sample jobs or the test account | `js/data/seed-jobs.js`, `js/data/seed-state.js` |
| Lists of fields, provinces, job types; test login; PIN | `js/config.js` |
| Which page shows, or a new page | `js/core/router.js` |
| Data not saving | `js/core/store.js` |

## The sign-up guard

A logged-in person can only see the step they still have to finish, in this order (`js/services/access.js`):

1. **Consent** to the current privacy notice (`consent` page)
2. **Setup** finished: CV, details, preferences (`setup` page)
3. An **active plan** (`subscribe` page)

The router asks `pendingStep()` on every redraw, so typing `#jobs` in the address can't skip a step. Applying, by hand or automatically, checks the same rules (`canApply()`). Admin is the only page outside the guard.

## How a page works

Every page in `js/views/` exports two functions:

- `render()` returns the page's HTML as text.
- `bind(root, ctx)` attaches the button and form handlers after the HTML is on screen.

`ctx` is a small toolkit the router hands every page: `ctx.go('jobs')` moves to a page, `ctx.refresh()` redraws the current page, `ctx.toast('Saved.')` shows a message, and `ctx.autoApply()` runs auto-apply and reports how many CVs went out. Pages never import the router, which keeps the parts independent.

Any button with `data-go="pagename"` moves to that page without extra code.

## How data flows

1. A page calls a service, for example `apply(jobId, 'one-tap')`.
2. The service changes the data from `getState()` and calls `save()`.
3. The page calls `ctx.refresh()` and the router redraws from the saved data.

There is one copy of the data (`js/core/store.js`). Nothing else keeps its own copy.

## Adding a new page

1. Create `js/views/<name>.js` with `render()` and `bind(root, ctx)`.
2. Import it in `js/core/router.js` and add it to `PAGES`. Add it to `TAB_PAGES` if it needs a tab, and a tab button in `index.html`.
3. Put any page-only styles in `css/views.css`.
4. Add a test in `tests/app.spec.js`.

## Limits of this test version

- Data stays on one device. Two phones never see each other's accounts or jobs.
- Passwords are hashed in the browser only for the demo. A live version must use a server.
- No real applications are sent. Employer replies are simulated on a timer.
- Payments are a test checkout. A live version sends people to a payment provider's page and learns they paid from the provider's server, never from the browser.
- CV reading uses fixed rules on the device (`js/services/cv-reader.js`). It reads typed PDF and Word CVs, but not scanned or photographed ones. **Decided (Oct 2026): keep this for launch and add AI CV reading later**, on the server the live version will need. When that happens, the privacy notice must say CVs are sent to an AI service, and `PRIVACY_VERSION` must go up.
- The privacy notice is a draft. A lawyer must check it, and the Information Officer details must be added, before real people use the app.
