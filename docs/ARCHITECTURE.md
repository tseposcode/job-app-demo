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
| Data | `js/data/*.js` | Sample jobs and the test account | No |
| Helpers | `js/lib/*.js`, `js/config.js` | Formatting, icons, fixed lists and settings | No |
| Styles | `css/*.css` | Colours (`tokens.css`), basics, shared pieces, page-only styles | — |

## "Something is wrong with X. Where do I look?"

| Problem | Open this file |
|---|---|
| Colours or fonts | `css/tokens.css` |
| A button, card, pill or the tab bar looks wrong everywhere | `css/components.css` |
| Something only looks wrong on Profile or Admin | `css/views.css` |
| Log in or sign up fails | `js/services/auth.js` (rules), `js/views/login.js` / `signup.js` (page) |
| Match score is wrong or the "Why this match" text | `js/services/matching.js` |
| Auto-apply sends to the wrong jobs | `js/services/applications.js` → `runAutoApply()` |
| Statuses (Sent / Viewed / Interview) behave oddly | `js/services/applications.js` → `makeApplication()`, `statusOf()` |
| Search, filters or sorting on the Jobs page | `js/views/jobs.js` |
| Applied page list or filter chips | `js/views/applied.js` |
| CV upload or photo upload | `js/views/profile.js` → `setupProfileUploads()`, and `js/core/files.js` |
| Job details sheet, Apply or Withdraw button | `js/views/sheets/job-detail.js` |
| Edit profile form | `js/views/sheets/profile-edit.js` |
| Admin PIN, add/edit/delete jobs, reset | `js/views/admin.js`, `js/views/sheets/job-edit.js` |
| The sample jobs or the test account | `js/data/seed-jobs.js`, `js/data/seed-state.js` |
| Lists of fields, provinces, job types; test login; PIN | `js/config.js` |
| Which page shows, or a new page | `js/core/router.js` |
| Data not saving | `js/core/store.js` |

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
