# Working on Job Auto

How we change the code, so that every change is small, checked and easy to undo.
Tsepo builds; the code auditor reviews every change before it reaches `main`.

## The flow for every change

1. **Start from fresh `main`.**
   `git checkout main` then `git pull`
2. **Make a branch for one thing.** Name it by type and topic:
   `feat/paywall`, `fix/cv-upload-size`, `style/new-colours`, `docs/readme`, `refactor/matching`
   `git checkout -b feat/paywall`
3. **Change only what the branch is about.** If you spot another problem, note it and fix it on its own branch.
4. **Check it before you share it.**
   - Run the app (see README) and click through what you changed.
   - `npm run check` runs the linter, the formatter check and the automatic tests.
5. **Commit in small steps** with a clear message (see below).
6. **Push and open a pull request (PR)** on GitHub into `main`. Fill in the template.
7. **The auditor reviews.** Fix what they ask on the same branch and push again.
8. **Merge only after approval.** Then delete the branch.

Never push straight to `main`.

## Commit messages

We use the Conventional Commits style: `type: what changed`, in the present tense, under about 70 characters.

| Type | Use for | Example |
|---|---|---|
| `feat` | A new feature | `feat: add subscription paywall after sign-up` |
| `fix` | A bug fix | `fix: stop auto-apply re-applying after withdraw` |
| `style` | Looks only (CSS) | `style: raise contrast of card text` |
| `refactor` | Same behaviour, cleaner code | `refactor: move match weights into config` |
| `docs` | Documentation | `docs: explain how to add a page` |
| `test` | Tests only | `test: cover the POPIA consent step` |
| `chore` | Tooling, settings | `chore: update Prettier` |

## Code rules

- **One file, one job.** Follow the map in `docs/ARCHITECTURE.md`. Rules go in `js/services/`, screens in `js/views/`.
- **Services never touch the screen.** No `document`, no HTML in `js/services/`.
- **Pages never import the router.** Use `ctx.go`, `ctx.refresh`, `ctx.toast`.
- **Escape every bit of user text** with `esc()` before it goes into HTML.
- **Colours only in `css/tokens.css`.** Components use the `var(--…)` names, never raw colour codes.
- **Fixed lists and settings live in `js/config.js`**, not scattered through the code.
- **Small functions with clear names.** If a function needs a long comment to explain it, split it.
- **Comment the why, not the what.**
- Formatting is automatic: Prettier on save (VS Code settings are in `.vscode/`).

## Personal information (POPIA)

- **Never commit a real person's CV, ID number, phone number or email**, not even for testing. Use the made-up test data.
- No passwords, API keys or tokens in the code. When a server is added, secrets go in environment variables that are never committed.
- `.gitignore` blocks `*.pdf` and a `cvs/` folder to help prevent accidents.

## Checklist for the code auditor

When reviewing a PR, check:

- [ ] The PR does one thing, and its title says what.
- [ ] The app runs and the changed part works on a phone-sized screen.
- [ ] `npm run check` passes.
- [ ] Code is in the right layer (see `docs/ARCHITECTURE.md`).
- [ ] User text is escaped; no `innerHTML` with raw input.
- [ ] No real personal data, passwords or keys.
- [ ] New behaviour has a test, or the PR says why not.
- [ ] `CHANGELOG.md` has a line for anything a user would notice.
