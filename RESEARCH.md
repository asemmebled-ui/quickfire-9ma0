# RESEARCH.md — Quickfire 9MA0

Research carried out 16 November 2026. "Verified" means I read the number in the primary document myself
(Pearson PDFs were downloaded and text-extracted). Anything I could not check at source is marked.

## 1. What I corrected or added relative to the brief

| Item in brief | Finding | Status |
|---|---|---|
| June 2024 boundaries "not confirmed" | A\* 251, A 205, B 167, C 130, D 93, E 56 | Verified (Pearson PDF) |
| June 2026 boundaries "not confirmed" | A\* 254, A 210, B 173, C 136, D 100, E 64 | Verified (Pearson PDF) |
| "Use the most recent boundaries as the main target" | The most recent series is now **June 2026 (A\* = 254)**, not June 2025 (258) | Changed |
| Large Data Set is "UK weather station data" | It is **5 UK stations + 3 overseas** (Camborne, Heathrow, Hurn, Leeming, Leuchars; Beijing, Jacksonville, Perth), May–Oct **1987** and May–Oct **2015** | Corrected |
| "ts-fsrs (FSRS-6)" | Latest `ts-fsrs` is **6.0.0**, but the library version is not the algorithm version. v6 **defaults to FSRS-7**, has a new API, and needs Node >= 24. FSRS-6 must be pinned explicitly (`FSRS6Model`). | Corrected |
| June 2027 dates "if published" | **Final** timetable is published (below) | Verified |
| Rohrer et al. "61% vs 38%" | Paper reports 61% vs 38%, d = 0.83; the IES/WWC record gives means 62.17 vs 37.60. Published online 2019, in print 2020. | Confirmed, nuance added |

Everything else in the brief's "verified facts" section checked out.

## 2. Exam structure (9MA0) — verified

Source: specification, Issue 4, February 2020 (the current issue on Pearson's site).

- Paper 1 Pure Mathematics 1 (9MA0/01), Paper 2 Pure Mathematics 2 (9MA0/02), Paper 3 Statistics and
  Mechanics (9MA0/03). Each 2 hours, 100 marks, one-third of the qualification. Total 300.
- Any Pure content can appear on either Paper 1 or Paper 2.
- Paper 3: Section A Statistics, Section B Mechanics, 50 marks each.
- Spec content numbering used as the app's spec references:
  - Pure: 1 Proof (1.1) · 2 Algebra and functions (2.1–2.11) · 3 Coordinate geometry (3.1–3.4) ·
    4 Sequences and series (4.1–4.6) · 5 Trigonometry (5.1–5.9) · 6 Exponentials and logarithms (6.1–6.7) ·
    7 Differentiation (7.1–7.6) · 8 Integration (8.1–8.8) · 9 Numerical methods (9.1–9.5) · 10 Vectors (10.1–10.5)
  - Statistics: 1 Sampling (1.1) · 2 Data presentation and interpretation (2.1–2.4) · 3 Probability (3.1–3.3) ·
    4 Statistical distributions (4.1–4.3) · 5 Hypothesis testing (5.1–5.3)
  - Mechanics: 6 Quantities and units (6.1) · 7 Kinematics (7.1–7.5) · 8 Forces and Newton's laws (8.1–8.6) ·
    9 Moments (9.1)
  - 89 content points in total (Pure 62, Statistics 14, Mechanics 13). The coverage report checks every one.

## 3. June 2027 exam dates — verified, FINAL timetable

Source: Pearson Edexcel GCE Summer 2027 Examination Timetable — FINAL.

| Paper | Date | Session | Length |
|---|---|---|---|
| 9MA0/01 Pure Mathematics 1 | Wednesday 26 May 2027 | Afternoon | 2h 00m |
| 9MA0/02 Pure Mathematics 2 | Wednesday 9 June 2027 | Afternoon | 2h 00m |
| 9MA0/03 Statistics & Mechanics | Wednesday 16 June 2027 | Afternoon | 2h 00m |

The app ships with these and still lets you edit them (private candidates should confirm with their exam centre).

## 4. Grade boundaries, overall out of 300 — verified from Pearson PDFs

| Series | A\* | A | B | C | D | E | Checked against |
|---|---|---|---|---|---|---|---|
| June 2026 | 254 | 210 | 173 | 136 | 100 | 64 | Pearson PDF |
| June 2025 | 258 | 214 | 178 | 142 | 106 | 71 | Pearson PDF |
| June 2024 | 251 | 205 | 167 | 130 | 93 | 56 | Pearson PDF |
| June 2023 | 244 | 196 | 158 | 121 | 84 | 47 | Pearson PDF |
| June 2022 | 217 | 164 | 130 | 96 | 62 | 28 | Pearson PDF |
| June 2019 | 217 | 165 | 134 | 103 | 73 | 43 | Secondary source only |
| June 2018 | 229 | 184 | 155 | 126 | 98 | 70 | Secondary source only |

- 2020 and 2021 summer series were cancelled. Autumn resit series are excluded (tiny, unrepresentative cohorts).
- 2022 was deliberately graded generously after the pandemic; 2023 kept some protection. The app's main target
  is June 2026, and the "range" it shows uses 2023–2026 by default, with 2022 and earlier shown as context.
- June 2026 notional paper boundaries (illustrative only; the grade is awarded on the 300 total):
  Paper 1: A\* 81, A 67 · Paper 2: A\* 87, A 75 · Paper 3: A\* 86, A 68.

## 5. Large Data Set

- Spec: students must be familiar with it; no copy is taken into the exam; detailed knowledge of individual
  values is not required. Pearson says it reviews the data set annually and notifies centres **before the start
  of the two-year course** if it changes.
- I found no notice of a change for 2027 exams, so the app assumes the current weather data set. **Not verified
  at source** — I could not find a Pearson page stating the 2027 version explicitly. Worth a one-off check with
  Pearson or your exam centre; the LDS deck is a single content file and easy to update.

## 6. Formulae booklet — verified

Source: *Mathematical Formulae and Statistical Tables*, Issue 1, July 2017 (A Level Mathematics section).

**Given in the booklet (so the app does not drill these as "memorise"):** sphere surface area, cone curved
surface area; arithmetic series sum; binomial series (both forms); change of base, e^(x ln a) = a^x; geometric
series S_n and S_inf; sin/cos/tan(A ± B); the four sum-to-product identities; small-angle approximations; first
principles; derivatives of tan kx, sec kx, cot kx, cosec kx; quotient rule; integrals of sec² kx, tan kx, cot kx,
cosec kx, sec kx; integration by parts; trapezium rule; Newton–Raphson; P(A′), addition rule, multiplication
rule, Bayes-style conditional formula, independence; standard deviation formulae and S_xx; binomial P(X = x),
mean and variance; distribution of the sample mean; the five SUVAT equations.

**Not given (these are what the memorise decks drill):** quadratic formula and discriminant; laws of indices and
logs; nth term of arithmetic/geometric sequences; sine and cosine rules, ½ab sin C; arc length and sector area;
sin²+cos²=1, 1+tan²=sec², 1+cot²=cosec²; **double-angle formulae**; R cos(θ ± α) form; exact trig values;
derivatives of xⁿ, sin kx, cos kx, e^(kx), ln x, a^(kx); **product rule and chain rule**; integrals of xⁿ, 1/x,
e^(kx), sin kx, cos kx; parametric and implicit differentiation rules; circle equation; vector magnitude;
F = ma, W = mg, F ≤ μR, moment = force × distance; projectile results (must be derived); normal standardisation
z = (x − μ)/σ; hypothesis-test wording.

## 7. Learning science

- **Dunlosky, Rawson, Marsh, Nathan & Willingham (2013)**, *Psychological Science in the Public Interest* 14(1),
  4–58. Practice testing and distributed practice were the only two of ten techniques rated high utility.
  Interleaved practice was rated moderate (at the time). *Cited from my own knowledge of the paper; I did not
  re-download it in this session.*
- **Rohrer, Dedrick, Hartwig & Cheung (2020)**, *J. Educ. Psychol.* 112(1), 40–52. Preregistered cluster RCT,
  787 Year-8-equivalent (US grade 7) students, 54 classes. Unannounced test one month later: 61% interleaved vs
  38% blocked, d = 0.83, 95% CI [0.68, 0.97]. Confirmed against the IES/What Works Clearinghouse record.
  Caveat for honesty in the app: this was 12–13 year olds on worksheets in one US district, not A-level students.
- **Hypercorrection** (Butterfield & Metcalfe, 2001): high-confidence errors are more likely to be corrected
  after feedback, which is why the app asks for confidence first and re-queues confident errors. *From my own
  knowledge; not re-fetched.*

## 8. ts-fsrs

- npm `latest` is **6.0.0**. Requires Node >= 24 for tooling.
- v6 API: `scheduler.newCard({now})`, `scheduler.review({card, grade, now})` → `{card, revlog}`,
  `scheduler.preview(...)`, retrievability via `scheduler.model.forgettingCurve(card, elapsedDays)`.
  Card fields are camelCase (`dueAt`, `lastReviewAt`, `stability`, `difficulty`, `reps`, `lapses`, `state`).
- `DefaultScheduler()` uses FSRS-7. The brief asks for FSRS-6. Tested after installing: v6.0.0 still exports the
  compatibility API (`fsrs()`, `generatorParameters`, `createEmptyCard`, `next`) and its default weights are the
  21-parameter FSRS-6 set (`FSRSVersion` reports v6.0.0). The app uses that path, asserts 21 weights at start-up,
  and computes retrievability with the FSRS-6 forgetting curve (unit-tested: R = 0.90 when elapsed time = stability).

## 9. Sources

- Specification Issue 4: https://qualifications.pearson.com/content/dam/pdf/A%20Level/Mathematics/2017/specification-and-sample-assesment/a-level-l3-mathematics-specification-issue4.pdf
- Formulae booklet: https://qualifications.pearson.com/content/dam/pdf/A%20Level/Mathematics/2017/specification-and-sample-assesment/pearson-edexcel-a-level-gce-in-mathematics-formulae-book.pdf
- Final summer 2027 timetable: https://qualifications.pearson.com/content/dam/pdf/Support/Examination-timetables/gce-summer-2027-final.pdf
- Boundaries 2026: https://qualifications.pearson.com/content/dam/pdf/Support/Grade-boundaries/A-level/grade-boundaries-june-2026-gce.pdf
- Notional paper boundaries 2026: https://qualifications.pearson.com/content/dam/pdf/Support/Grade-boundaries/A-level/grade-boundaries-june-2026-notional-component-gce.pdf
- Boundaries 2025: https://qualifications.pearson.com/content/dam/pdf/Support/Grade-boundaries/A-level/grade-boundaries-june-2025-gce.pdf
- Boundaries 2024: https://qualifications.pearson.com/content/dam/pdf/Support/Grade-boundaries/A-level/grade-boundaries-june-2024-gce.pdf
- Boundaries 2023: https://qualifications.pearson.com/content/dam/pdf/Support/Grade-boundaries/A-level/2306-gce-subject-grade-boundaries.pdf
- Boundaries 2022: https://qualifications.pearson.com/content/dam/pdf/Support/Grade-boundaries/A-level/2206-gce-subject-grade-boundaries.pdf
- 2018/2019 boundaries (secondary): https://alevelmathsacademy.co.uk/grade-boundaries/edexcel-maths
- Rohrer et al. record: https://ies.ed.gov/ncee/wwc/Study/88770
- ts-fsrs: https://github.com/open-spaced-repetition/ts-fsrs and https://open-spaced-repetition.github.io/ts-fsrs/guide/migration
