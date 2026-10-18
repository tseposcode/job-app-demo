# Job Auto (test version)

A job app for graduate and entry-level jobs in South Africa that applies for you. This test version runs fully in the browser with made-up jobs; nothing is sent anywhere.

## Run it in VS Code

The app is split into modules, so it must be opened through a small local web server (double-clicking `index.html` will show a blank page).

**Easiest:** install the **Live Server** extension (VS Code will suggest it when you open the folder), then right-click `index.html` → **Open with Live Server**.

**Or with Node.js:** `npm install` once, then `npm start` and open http://127.0.0.1:5500.

## Try it

- **Test account:** `thabang@test.com` / `jameson`, or tap "Use the test account"
- **Admin:** Profile → Admin, PIN `2468`

## Where things are

```
index.html            the frame: header, page area, tab bar
css/                  tokens (colours), base, components, page-only styles
js/main.js            starts the app
js/config.js          fixed lists and settings
js/core/              saving data, CV files, page switching
js/services/          the rules: accounts, matching, applying, auto-apply
js/views/             one file per page, plus slide-up sheets
js/ui/                toast, sheet and form helpers
js/data/              sample jobs and the test account
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
