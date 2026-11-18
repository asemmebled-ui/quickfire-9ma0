# Adding your own questions

Questions live in TypeScript files in `src/content/`. Each file is a list built with small helper functions,
so a typo is caught by the type-checker and every answer is re-checked by SymPy before the app builds.

| File | What goes in it |
|---|---|
| `items-pure1.ts` | Pure Year 1 questions |
| `items-pure2.ts` | Pure Year 2 questions |
| `items-stats.ts` | Statistics |
| `items-mech.ts` | Mechanics |
| `decks.ts` | Flashcards |
| `gen-pure.ts`, `gen-applied.ts` | Generators (questions with random numbers) |
| `topics.ts` | Topic list, textbook chapters, spec points, mark weights |

## Writing maths

Write maths in LaTeX between `$...$` (inline) or `$$...$$` (on its own line). Wrap each string in ``L`...` ``
(it is `String.raw`) so backslashes don't need doubling: ``L`$\frac{1}{x^2}$` ``. `**bold**` also works.
Never write plain-text maths like `x^2/3` outside the dollar signs: `npm run check:render` rejects it.

## The five kinds of question

Each helper takes: **id** (unique), **topic** id (see `topics.ts`, e.g. `'p2.9'`), **spec** points
(e.g. `'P7.4'` or `'P7.4,P7.5'`), **difficulty** 1–5, the **stem**, the **answer**, the **worked solution**,
and optional extras.

```ts
// Numeric: 3 s.f. by default. Use { exact: true } for exact values, { sf: 2 } for g = 9.8 answers,
// { tol: 0.05 } for "1 decimal place" angles, { unit: 'm' } to show and strip units.
num('my1', 'p1.14', 'P6.5', 2, L`Solve $e^{2x} = 5$ to 3 significant figures.`, Math.log(5) / 2,
  L`$2x = \ln 5 \Rightarrow x = 0.805$.`,
  { v: 'log(5)/2', err: 'Take ln of both sides before dividing.' }),

// Multiple choice / which-method: the FIRST option is the correct one (they are shuffled on screen).
mcq('my2', 'p2.6', 'P5.5', 1, L`$1 + \tan^2 x \equiv$`, [L`$\sec^2 x$`, L`$\operatorname{cosec}^2 x$`, L`$\cot^2 x$`],
  L`Divide $\sin^2 x + \cos^2 x = 1$ by $\cos^2 x$.`, { memo: 'memorise' }),
method('my3', 'p2.11', 'P8.5', 2, L`Which method for $\int x\cos x\,dx$?`, ['Integration by parts', 'Substitution', 'Partial fractions'],
  L`A product of a polynomial and a trig function.`),

// Algebraic answer, marked by evaluating at random points. { addC: true } for indefinite integrals.
expr('my4', 'p2.9', 'P7.4', 2, L`Differentiate $y = \sin 3x$.`, L`3\cos 3x`, L`Chain rule.`, { v: 'diff(sin(3*x), x)' }),

// Self-marked, multi-step (done on paper): list the mark points.
self('my5', 'p1.2', 'P2.3', 3, L`Find the set of values of $k$ for which …`,
  [['M1', 'Uses $b^2 - 4ac > 0$'], ['A1', 'Correct critical values'], ['A1', 'Correct set']],
  L`Full worked solution …`),

// Flashcard: deck id, topic, spec, front, back.
card('my6', 'not-in-booklet', 'p2.7', 'P5.6', L`$\sin 2A$`, L`$2\sin A\cos A$`),
```

### Optional extras (`{ ... }` last argument)

- `v`: **the SymPy check**. A Python/SymPy expression that recomputes the answer from scratch. Required for
  numeric and expression questions. Helpers available inside it: `rad(deg)`, `deg(rad)`, `binompdf`,
  `binomcdf`, `normcdf(x, mu, sigma)`, `invnorm(p, mu, sigma)`, `roots('expr in x', lo, hi)`, `iterate`,
  `trap`, `ode`. For multiple choice where the answer is not a number, use
  `{ v: { s: 'Integer(<a true/false check>)', val: 1 } }`.
- `err`: the common mistake behind wrong answers (shown after answering).
- `memo`: `'memorise'` (not in the formula booklet) or `'booklet'` (given in the exam).
- `dia`: a diagram, e.g. `{ k: 'graph', fns: ['x**2-4'], x: [-3, 3], y: [-5, 3], shade: [-2, 2] }`,
  `{ k: 'incline', angle: 30, rough: true, forces: [{ dir: 'normal', label: 'R' }, { dir: 'weight', label: 'mg' }] }`,
  `{ k: 'venn', a: '0.2', b: '0.3', ab: '0.1', out: '0.4' }`. All kinds are listed in `src/lib/types.ts`.
- `weak`: tag as a drill for one of your tracked mistakes: `'const'`, `'logdomain'` or `'vecunits'`.
- `src: 'exam-style'` to label it "Exam-style (original)".

## Then run the checks

```bash
npm run check
```

This runs the unit tests, renders every LaTeX string and diagram, checks spec coverage, re-solves every answer
with SymPy, and builds. If anything fails it tells you which question id and why. Fix it, run again, then
`git push` to redeploy.
