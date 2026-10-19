# Job Auto (test version)

A job app for graduate and entry-level jobs in South Africa that applies for you. This test version runs fully in the browser with made-up jobs; nothing is sent anywhere.

## Run it in VS Code

The app is split into modules, so it must be opened through a small local web server (double-clicking `index.html` will show a blank page).

**Easiest:** install the **Live Server** extension (VS Code will suggest it when you open the folder), then right-click `index.html` → **Open with Live Server**.

**Or with Node.js:** `npm install` once, then `npm start` and open http://127.0.0.1:5500.

## Try it

- **Test account:** `thabang@test.com` / `jameson`, or tap "Use the test account". It is already signed up and subscribed, so it goes straight to Jobs.
- **Admin:** Profile → Admin, PIN `2468`

### The full sign-up, as a new user sees it

1. **Account:** "Create an account" on the log-in page.
2. **Privacy:** the POPIA notice and consent boxes. Nothing is pre-ticked; marketing emails are a separate, optional box. "I don't agree" deletes the new account.
3. **CV:** upload a PDF or Word (.docx) CV, or tap one of the six **sample CVs** (made-up people in `samples/cvs/`). The app reads the file in the browser.
4. **Details:** filled in from the CV, for the person to check.
5. **Preferences:** job types, fields, places and pay (also from the CV), and Automatic or One-tap applying.
6. **Plan:** the paywall. It shows how many jobs already match, then a **test checkout** (no card details, no money).

After paying, auto-apply sends the CV to every strong match and the Applied tab updates over the next few minutes as the made-up employers "reply".

| Sample CV | Who | Jobs auto-apply sends to |
|---|---|---|
| Lerato Mokoena | Computer Science, Gauteng or remote | 4 (data and software) |
| Sipho Ndlovu | Logistics diploma, KZN, Gauteng, Eastern Cape; his CV says he will relocate, so that box is ticked | 3 (supply chain) |
| Aisha Petersen | BCom Accounting, Western Cape, Gauteng, KZN or remote | 3 (finance and admin), plus 2 more if she taps "Include them" (willing to relocate) |

The last three samples are written the way real people write CVs, to show the reader is not tied to one template:

| Sample CV | Style | What it shows |
|---|---|---|
| Nomsa Dlamini (PDF) | Classic one-column, "CURRICULUM VITAE" title, personal details with labels | Reads labelled details; warns about the ID number line; picks up "willing to relocate" |
| Kabelo Mahlangu (PDF) | Two columns with a shaded sidebar, like a Canva template | Reads each column separately |
| Zanele Khumalo (Word .docx) | Personal details table, capital headings, bullet lists | Reads Word files; skips a diploma that is still in progress; warns about the health line |

### What the CV reader can and can't read

- **Reads:** PDF and Word (.docx) CVs with selectable text; headings in any style; labelled details (`Cell no:`, `Address:`); tables; bullet lists; two-column layouts; South African towns, provinces, qualifications and phone formats.
- **Can't read yet:** scanned or photographed CVs (pictures of text) and old Word `.doc` files. The person is asked to fill in their details instead.
- **Job preferences:** taken from the CV if it says what the person wants; otherwise suggested from what they studied, their skills and where they live, and the screen says they were suggested.
- It never saves ID numbers, race, religion, health or criminal record details, and it warns the person when their CV shows them.

On Profile: cancel or keep the plan, turn marketing emails on or off, read the privacy notice, **download my data**, and **withdraw consent and delete the account**.

**Placeholders to replace before launch:** plan prices (`js/config.js` → `PLANS`), the privacy contact and Information Officer (`PRIVACY_CONTACT`), and the privacy notice wording (`js/data/privacy-notice.js`, a draft that a lawyer must check).

## Where things are

```
index.html            the frame: header (with the logo), page area, tab bar
img/                  the logo and phone home-screen icons
css/                  tokens (colours), base, components, page-only styles
js/main.js            starts the app
js/config.js          fixed lists and settings
js/core/              saving data, CV files, page switching
js/services/          the rules: accounts, matching, applying, auto-apply
js/views/             one file per page, plus slide-up sheets
js/ui/                toast, sheet and form helpers
js/data/              sample jobs, the test account, the privacy notice text
js/vendor/pdfjs/      pdf.js (Mozilla, Apache 2.0) for reading PDF CVs in the browser
samples/              the six made-up CVs and the two scripts that make them
tests/                automatic checks (Playwright)
docs/ARCHITECTURE.md  map of the code and "where do I fix X?"
```

## Checks

```
npm run lint      # code mistakes (ESLint)
npm run format    # tidy formatting (Prettier)
npm test          # click through the app automatically (first time: npx playwright install chromium)
npm run check     # all of the above, run before every pull request
```

## Working on it

Read `CONTRIBUTING.md` before making changes: branches, commit messages, pull requests and the review checklist.

All jobs and companies are made up. The test password is for the demo only.
