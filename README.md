# Quickfire 9MA0

Quick-fire revision for **Pearson Edexcel A level Mathematics (9MA0)**, built on retrieval practice, spaced
repetition (FSRS-6), interleaving and confidence ratings. It gives an honest predicted grade range and readiness score.
It installs on iPhone and Android, works fully offline, and keeps everything on your device.

- `RESEARCH.md`: what was checked against primary sources (spec, booklet, boundaries, 2027 timetable, papers) and what was corrected.
- `PLAN.md`: architecture, data schema and the readiness model.
- `COVERAGE.md`: every spec point and how many questions cover it (generated).
- `ADDING-QUESTIONS.md`: how to add your own questions.

## What's in it

| | |
|---|---|
| Hand-written questions | 262 (numeric, multiple choice, "which method?", algebraic, self-marked M1/A1/B1) |
| Generators | 107 parameterised skills, each producing unlimited fresh variants |
| Flashcards | 155 in 8 decks (not-in-booklet formulae, exact trig, calculus, command words, modelling, hypothesis wording, Large Data Set, calculator key sequences) |
| Past-paper index | Every 9MA0 series 2017–2026, with a "log a paper" flow |
| Spec coverage | All 89 content points, zero gaps |

## Install on your phone

The app must be served over HTTPS (see **Deploy** below). Then:

**iPhone (Safari):** open the site → tap the **Share** button → **Add to Home Screen** → **Add**. Open it from the
home-screen icon: it runs full-screen and works offline. (It must be Safari; other iOS browsers can't install apps.)

**Android (Chrome):** open the site → tap **⋮** → **Add to Home screen** (or **Install app**) → **Install**.

**Laptop (Chrome or Edge):** click the install icon in the address bar.

Open it once while online; after that it works with no connection.

## Back up and move between devices

Everything is stored only on the device you're using. **More → Backup → Export backup** downloads a `.json` file.
On the other device: **More → Backup → Import backup**. Importing replaces that device's data with the backup.
Back up regularly. Clearing Safari's website data deletes the app's data.

## Deploy (free, HTTPS) with GitHub Pages

One-time setup (about 10 minutes):

1. Create a free account at github.com and a new **public** repository, e.g. `quickfire-9ma0`.
2. In this folder:
   ```bash
   git init -b main
   ```
   ```bash
   git add -A
   ```
   ```bash
   git commit -m "Quickfire 9MA0"
   ```
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/quickfire-9ma0.git
   ```
   ```bash
   git push -u origin main
   ```
3. On GitHub: repository → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Open the **Actions** tab. The "CI and deploy" workflow runs every check (unit tests, render check, coverage,
   SymPy verification, end-to-end tests including offline mode) and deploys only if they all pass.
   Your app is then at `https://YOUR-USERNAME.github.io/quickfire-9ma0/`.

**Redeploy (one command):** after changing anything,

```bash
git commit -am "Update" && git push
```

Alternatives: Netlify or Cloudflare Pages also work. Build command `npm run build`, output folder `dist`.

## Run and check it locally

Needs Node.js 24+ and Python 3 with `pip install sympy mpmath`.

```bash
npm install
```
```bash
npm run check
```
```bash
npm run e2e
```

`npm run dev` starts a development server. `npm run review-sample` prints a random 10% sample to re-solve by hand.

## Known limitations (honest list)

- **Bank size:** 262 hand-written questions + 107 generators (unlimited variants; 2,675 generated instances are
  verified on every build) + 155 flashcards. That is fewer than 600 *fixed* questions; the generators cover the
  routine skills instead. The thinnest spec points have only 1–2 entries (see `COVERAGE.md`).
- **Past-paper index:** per-paper, not per-question. The app doesn't invent per-question topic data it hasn't
  read; you tag each question's topic when you log a paper. Only a few direct PDF links were confirmed; the rest
  go to Pearson's search page. The most recent series may be restricted to schools for a while.
- **Topic mark weights** are informed estimates, not Pearson figures. They improve your prediction only
  through the papers you log.
- **The prediction model's constants** (prior, weights, half-lives) are reasoned judgement, not fitted to data.
  Treat early predictions as rough; they firm up after 2–3 timed papers.
- **"Exam-style (predicted)"** practice is coverage-gap weighting. Nobody can predict the paper.
- **Diagrams** are generated for graphs, inclined planes, forces, pulleys, beams, projectiles, Venn/tree
  diagrams, normal curves, v–t graphs and box plots. Not every question that *could* have a diagram has one.
- **Algebra marking** is by numeric evaluation at 7 points. It's very reliable for equivalence, but it doesn't
  check *form* (e.g. it accepts an unsimplified answer that an examiner might want simplified).
- **Large Data Set:** the deck assumes the current weather data set; I couldn't find a Pearson notice
  confirming the 2027 version explicitly.
- **Performance:** with 4× CPU throttling (mid-range phone), repeat visits load in 0.3–0.35 s from the
  offline cache. The first-ever visit on a slow 1.6 Mbps connection took 2.3–2.5 s (target 2 s). Tab switches
  measured 280–420 ms including test-harness overhead (target 100 ms). The main bundle is 282 KB gzipped.
- **Lighthouse:** its PWA category was removed in Lighthouse 12, and it would not launch on the build machine.
  Installability and offline mode are verified by the Playwright tests instead (manifest, icons, service worker,
  full offline reload).
- **Calculator key sequences** follow Casio's fx-991CW/fx-CG100 menu structure as documented, but menu names can
  differ slightly by firmware. Check them once on your own calculator.
- **No sync** between devices yet; use backup files. The storage layer is designed so a Supabase sync could be added.
