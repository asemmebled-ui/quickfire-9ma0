# PLAN.md — Quickfire 9MA0

## Architecture

Local-first PWA. No server, no account. Everything runs in the browser and is stored in IndexedDB.

```
src/
  lib/        pure logic, no UI (unit-tested)
    types.ts       item schema
    mathparse.ts   LaTeX/ASCII maths parser + numeric evaluator
    check.ts       answer checking (numeric s.f. rules, expression equivalence, +C)
    stats.ts       binomial / normal distribution functions
    scheduler.ts   FSRS-6 wrapper (ts-fsrs) + confidence -> rating mapping
    session.ts     builds interleaved sessions and the "Today" plan
    model.ts       topic mastery, predicted grade range, readiness, marks-per-hour ranking
    db.ts          Dexie tables + JSON backup/restore
    diagrams.ts    diagram spec -> SVG string
  content/    versioned question content (TypeScript, strictly typed)
    topics.ts, boundaries.ts, items-*.ts, generators.ts, decks.ts, papers.ts
  ui/         React screens
scripts/      export-bank, render check, spec coverage report
verify/       verify.py — independent SymPy/mpmath re-computation of every answer
tests/        vitest unit tests;  e2e/ Playwright tests
```

## Choices that differ from the brief (and why)

| Brief | Choice | Reason |
|---|---|---|
| Tailwind | Hand-written CSS with design tokens | One stylesheet, no build config, smaller bundle; nothing in the UI needs a utility framework |
| Charting library | Hand-written SVG charts | Five small charts; a library would be the biggest thing in the bundle and slow first load on a phone |
| CortexJS Compute Engine | Own parser + numeric equivalence at random points | ~250 lines, fully unit-tested, works offline, no multi-MB dependency. Equivalence is decided numerically at several random points, never by string matching |
| ts-fsrs "FSRS-6" | `ts-fsrs` 6.0.0 via its compatibility `fsrs()` API with the 21-weight FSRS-6 defaults (checked at start-up) | v6's new default scheduler is FSRS-7, and `defineScheduler({ model: FSRS6Model })` rejected a plain config in testing. The compatibility API is the stable, documented FSRS-6 path |
| 600 static items | 262 hand-written questions + 155 flashcards + 107 parameterised generators | Each generator is one scheduled *skill* that produces a fresh question every time (better for learning than re-seeing one fixed question). The verifier checks 25 seeds of every generator on each build. Exact counts are printed by `npm run check:coverage` |
| Lighthouse PWA audit | Playwright tests for manifest, icons, service worker and full offline reload, plus a throttled load-time test | Lighthouse 12 removed the PWA category |
| Charts | Hand-written SVG | see above |
| Past-paper index "every question" | Per-paper index with links to Pearson's PDFs; per-question topic tags entered or confirmed by you when you log a paper | I will not invent per-question metadata I haven't read. Topic weights start from stated estimates and are refined by logged papers |

## Data schema (content)

Every item: `id, topic, spec[], diff (1–5), type, stem, answer, solution, err (common mistake), memo
('memorise' | 'booklet'), source ('original' | 'exam-style'), diagram?, weak?, v? (verification spec)`.
Types: `numeric`, `mcq`, `method` (which-method MCQ), `expr`, `self` (self-marked with M1/A1/B1 points), `card`.
Text uses `$...$` for inline maths and `$$...$$` for display maths (KaTeX).
`v.s` is a SymPy expression that independently recomputes the answer. See `ADDING-QUESTIONS.md`.

## Scheduling

- One FSRS-6 card per item or per generator. Desired retention 0.90.
- Rating: wrong -> Again; right + Guess -> Hard; right + Unsure -> Good; right + Sure -> Easy (Good if slow).
  Self-marked: >= 100% -> as above, >= 60% -> Hard, else Again.
- Hypercorrection: a wrong answer rated "Sure" is rated Again, re-queued later in the same session, and counted
  against calibration.
- Sessions are interleaved: no two consecutive questions from the same topic where avoidable.
- XP and streak are display-only. They never change what is scheduled.

## Readiness model (implemented in `src/lib/model.ts`, explained in-app)

Topic weight `w_t` = expected marks per 300 (Pure topics normalised to 200, Statistics to 50, Mechanics to 50).

Topic mastery `m_t` is a weighted average of evidence, shrunk towards a pessimistic prior:

```
m_t = ( n0*p0 + n_r*R_t + n_e*E_t + n_p*P_t ) / ( n0 + n_r + n_e + n_p )  *  (1 - 0.15 * hce_t)
```

- prior `p0 = 0.30`, `n0 = 3` (no evidence does not mean mastered)
- `R_t` mean FSRS retrievability now, scaled by the share of the topic's cards seen; `n_r = 0.5 * min(seen, 12)`
- `E_t` recency-weighted score on exam-style and self-marked items; `n_e = 1.5 * attempts` (max 15)
- `P_t` marks fraction on logged past-paper questions tagged to the topic, weight halving every 90 days;
  `n_p = 0.6 * decayed marks available`
- `hce_t` share of answers that were wrong while rated "Sure"
- topics not yet covered count as 0 for prediction and show grey, not red

Predicted marks per section = `sum(w_t * m_t) * k`, where `k = 0.85` is a transfer discount (quick-fire success
overstates exam marks). Each logged full paper gives a direct estimate for its section; the final section figure is
a precision-weighted blend of model and papers (timed papers count double, weight halves every 90 days).
Range = +/- 1.28 sd (about an 80% interval), sd from binomial-style evidence variance per topic plus a model
uncertainty term that shrinks as papers are logged (12% of section marks with none, 5% with three or more).

Readiness (0–100) = 25% coverage + 15% retention (not overdue) + 30% predicted vs A\* boundary + 30% recent
timed-paper performance. With no full timed paper logged it is capped at 60 and flagged.

Marks-per-hour ranking: `w_t * (1 - m_t) * ease_t`.

## Milestones

M1 shell + engine + storage · M2 Pure bank + generators + verifier · M3 Statistics, Mechanics, LDS, diagrams ·
M4 papers + model + dashboard · M5 decks, calculator, weakness drills, polish, deploy.
