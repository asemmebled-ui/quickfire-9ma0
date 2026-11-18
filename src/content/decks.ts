/**
 * Flashcard decks. "Not in booklet" was built by diffing against the official Pearson formulae
 * booklet (Issue 1, A Level Mathematics section): nothing here is given to you in the exam.
 */
import type { Item } from '../lib/types'
import { card } from './build'
const L = String.raw

// ---------- exact trig values (generated, each one machine-verified) ----------
const S2 = L`\frac{\sqrt2}{2}`, S3 = L`\frac{\sqrt3}{2}`, H = L`\frac12`
const TRIG: [string, number, string, string][] = [
  ['sin', 0, '0', 'sin(rad(0))'], ['sin', 30, H, ''], ['sin', 45, S2, ''], ['sin', 60, S3, ''], ['sin', 90, '1', ''],
  ['cos', 0, '1', ''], ['cos', 30, S3, ''], ['cos', 45, S2, ''], ['cos', 60, H, ''], ['cos', 90, '0', ''],
  ['tan', 0, '0', ''], ['tan', 30, L`\frac{\sqrt3}{3}`, ''], ['tan', 45, '1', ''], ['tan', 60, L`\sqrt3`, ''],
  ['sin', 120, S3, ''], ['cos', 120, '-' + H, ''], ['sin', 135, S2, ''], ['cos', 135, '-' + S2, ''], ['tan', 135, '-1', ''],
  ['sin', 150, H, ''], ['cos', 150, '-' + S3, ''], ['cos', 180, '-1', ''],
]
const RADS: Record<number, string> = { 0: '0', 30: L`\frac{\pi}{6}`, 45: L`\frac{\pi}{4}`, 60: L`\frac{\pi}{3}`, 90: L`\frac{\pi}{2}`, 120: L`\frac{2\pi}{3}`, 135: L`\frac{3\pi}{4}`, 150: L`\frac{5\pi}{6}`, 180: L`\pi` }
const fnVal = (f: string, d: number) => { const x = (d * Math.PI) / 180; const v = f === 'sin' ? Math.sin(x) : f === 'cos' ? Math.cos(x) : Math.tan(x); return Math.abs(v) < 1e-12 ? 0 : v }
const trigCards: Item[] = TRIG.flatMap(([f, d, tex], i) => {
  const useRad = i % 3 === 2 && d !== 0
  const arg = useRad ? RADS[d] : `${d}^\\circ`
  return [card(`tx${i}`, 'trig-exact', d > 90 || useRad ? 'p2.5' : 'p1.9', 'P5.3', L`Exact value of $${'\\' + (f)} ${arg}$`, L`$${tex}$` + (useRad ? L` $\left(${RADS[d]} = ${d}^\circ\right)$` : ''), { v: { s: `${f}(rad(${d}))`, val: fnVal(f, d) } })]
})
const radCards: Item[] = [30, 45, 60, 90, 120, 135, 150, 180].map((d) =>
  card(`rd${d}`, 'trig-exact', 'p2.5', 'P5.1', L`Convert $${d}^\circ$ to radians`, L`$${RADS[d]}$ (multiply by $\frac{\pi}{180}$)`, { v: { s: `rad(${d})`, val: (d * Math.PI) / 180 } }))

const c = (id: string, deck: string, topic: string, spec: string, front: string, back: string, memo: 'memorise' | 'booklet' = 'memorise') => card(id, deck, topic, spec, front, back, { memo })

const notInBooklet: Item[] = [
  c('nb1', 'not-in-booklet', 'p1.2', 'P2.3', 'Quadratic formula', L`$x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$`),
  c('nb2', 'not-in-booklet', 'p1.2', 'P2.3', 'Discriminant, and what its sign tells you', L`$b^2 - 4ac$. Positive: two distinct real roots. Zero: one repeated root. Negative: no real roots.`),
  c('nb3', 'not-in-booklet', 'p1.1', 'P2.1', 'Laws of indices (three main laws)', L`$a^m \times a^n = a^{m+n}$, $\quad a^m \div a^n = a^{m-n}$, $\quad (a^m)^n = a^{mn}$. Also $a^{-n} = \frac{1}{a^n}$ and $a^{\frac{m}{n}} = \sqrt[n]{a^m}$.`),
  c('nb4', 'not-in-booklet', 'p1.14', 'P6.4', 'Laws of logarithms (three laws)', L`$\log_a x + \log_a y = \log_a(xy)$, $\quad \log_a x - \log_a y = \log_a\frac{x}{y}$, $\quad k\log_a x = \log_a x^k$.`),
  c('nb5', 'not-in-booklet', 'p1.14', 'P6.3', L`What does $\log_a n = x$ mean?`, L`$a^x = n$. Also $\log_a a = 1$ and $\log_a 1 = 0$. The argument $n$ must be positive.`),
  c('nb6', 'not-in-booklet', 'p1.5', 'P3.1', 'Gradient condition for perpendicular lines', L`$m_1 \times m_2 = -1$ (negative reciprocals).`),
  c('nb7', 'not-in-booklet', 'p1.5', 'P3.1', 'Equation of a line through $(x_1, y_1)$ with gradient $m$', L`$y - y_1 = m(x - x_1)$`),
  c('nb8', 'not-in-booklet', 'p1.6', 'P3.2', 'Equation of a circle, centre $(a, b)$, radius $r$', L`$(x - a)^2 + (y - b)^2 = r^2$`),
  c('nb9', 'not-in-booklet', 'p1.9', 'P5.1', 'Sine rule', L`$\dfrac{a}{\sin A} = \dfrac{b}{\sin B} = \dfrac{c}{\sin C}$`),
  c('nb10', 'not-in-booklet', 'p1.9', 'P5.1', 'Cosine rule', L`$a^2 = b^2 + c^2 - 2bc\cos A$`),
  c('nb11', 'not-in-booklet', 'p1.9', 'P5.1', 'Area of a triangle (two sides and the included angle)', L`$\frac12ab\sin C$`),
  c('nb12', 'not-in-booklet', 'p1.10', 'P5.5', 'The two Year 1 trig identities', L`$\sin^2\theta + \cos^2\theta \equiv 1$ and $\tan\theta \equiv \dfrac{\sin\theta}{\cos\theta}$`),
  c('nb13', 'not-in-booklet', 'p2.6', 'P5.5', 'The two Year 2 Pythagorean identities', L`$1 + \tan^2\theta \equiv \sec^2\theta$ and $1 + \cot^2\theta \equiv \operatorname{cosec}^2\theta$`),
  c('nb14', 'not-in-booklet', 'p2.7', 'P5.6', L`$\sin 2A$`, L`$2\sin A\cos A$`),
  c('nb15', 'not-in-booklet', 'p2.7', 'P5.6', L`$\cos 2A$ (three forms)`, L`$\cos^2A - \sin^2A = 2\cos^2A - 1 = 1 - 2\sin^2A$`),
  c('nb16', 'not-in-booklet', 'p2.7', 'P5.6', L`$\tan 2A$`, L`$\dfrac{2\tan A}{1 - \tan^2A}$`),
  c('nb17', 'not-in-booklet', 'p2.5', 'P5.1', 'Arc length and sector area (radians)', L`$l = r\theta$ and $A = \frac12r^2\theta$`),
  c('nb18', 'not-in-booklet', 'p2.3', 'P4.4', L`$n$th term of an arithmetic sequence`, L`$u_n = a + (n - 1)d$. (The SUM formula is in the booklet; this is not.)`),
  c('nb19', 'not-in-booklet', 'p2.3', 'P4.5', L`$n$th term of a geometric sequence`, L`$u_n = ar^{n-1}$. (The sum formulae are in the booklet.)`),
  c('nb20', 'not-in-booklet', 'p1.12', 'P7.2', L`$\dfrac{d}{dx}(x^n)$`, L`$nx^{n-1}$`),
  c('nb21', 'not-in-booklet', 'p2.9', 'P7.4', 'Product rule', L`$\dfrac{d}{dx}(uv) = u\dfrac{dv}{dx} + v\dfrac{du}{dx}$. (The quotient rule IS in the booklet; the product rule is not.)`),
  c('nb22', 'not-in-booklet', 'p2.9', 'P7.4', 'Chain rule', L`$\dfrac{dy}{dx} = \dfrac{dy}{du} \times \dfrac{du}{dx}$`),
  c('nb23', 'not-in-booklet', 'p2.8', 'P7.5', 'Gradient of a parametric curve', L`$\dfrac{dy}{dx} = \dfrac{dy/dt}{dx/dt}$`),
  c('nb24', 'not-in-booklet', 'p1.11', 'P10.2', L`Magnitude of $x\mathbf{i} + y\mathbf{j} + z\mathbf{k}$`, L`$\sqrt{x^2 + y^2 + z^2}$`),
  c('nb25', 'not-in-booklet', 'm1.10', 'M8.2', "Newton's second law, and weight", L`$F = ma$ (with $F$ the RESULTANT force) and $W = mg$.`),
  c('nb26', 'not-in-booklet', 'm2.5', 'M8.6', 'Friction', L`$F \le \mu R$, with $F = \mu R$ when moving or in limiting equilibrium.`),
  c('nb27', 'not-in-booklet', 'm2.4', 'M9.1', 'Moment of a force', L`Force $\times$ perpendicular distance from the pivot. Units N m.`),
  c('nb28', 'not-in-booklet', 's2.3', 'S4.2', 'Standardising a normal variable', L`$Z = \dfrac{X - \mu}{\sigma}$, with $Z \sim N(0, 1)$`),
  c('nb29', 'not-in-booklet', 's1.3', 'S2.1', 'Frequency density', L`$\dfrac{\text{frequency}}{\text{class width}}$. Area of a histogram bar is proportional to frequency.`),
  c('nb30', 'not-in-booklet', 'p2.2', 'P2.9', L`Effect of $y = f(ax)$ and $y = af(x)$`, L`$f(ax)$: stretch parallel to the $x$-axis, scale factor $\frac1a$. $af(x)$: stretch parallel to the $y$-axis, scale factor $a$.`),
  c('nb31', 'not-in-booklet', 'p2.7', 'P5.6', L`Writing $a\sin x + b\cos x$ as $R\sin(x + \alpha)$`, L`$R = \sqrt{a^2 + b^2}$ and $\tan\alpha = \dfrac{b}{a}$. Always check by expanding $R\sin(x + \alpha)$ with the booklet formula.`),
  c('nb32', 'not-in-booklet', 'p2.5', 'P5.1', 'Area of a segment (radians)', L`$\frac12r^2(\theta - \sin\theta)$: sector minus triangle.`),
  c('nb33', 'not-in-booklet', 'm2.6', 'M7.5', 'Are the projectile formulae (range, time of flight, greatest height) in the booklet?', 'No. You must derive them from suvat each time: horizontal velocity constant, vertical acceleration $-g$.'),
  c('nb34', 'not-in-booklet', 's1.5', 'S3.1', 'Condition for independent events; condition for mutually exclusive events', L`Independent: $P(A \cap B) = P(A)P(B)$. Mutually exclusive: $P(A \cap B) = 0$.`, 'booklet'),
  c('nb35', 'not-in-booklet', 'p1.13', 'P8.3', 'Area between a curve and the $x$-axis when part is below the axis', 'Integrate each part separately and add the positive sizes. A region below the axis gives a negative integral.'),
]

const calculus: Item[] = [
  c('cl1', 'calculus', 'p2.9', 'P7.2', L`$\dfrac{d}{dx}(e^{kx})$`, L`$ke^{kx}$`),
  c('cl2', 'calculus', 'p2.9', 'P7.2', L`$\dfrac{d}{dx}(\ln x)$`, L`$\dfrac1x$`),
  c('cl3', 'calculus', 'p2.9', 'P7.2', L`$\dfrac{d}{dx}(\sin kx)$`, L`$k\cos kx$`),
  c('cl4', 'calculus', 'p2.9', 'P7.2', L`$\dfrac{d}{dx}(\cos kx)$`, L`$-k\sin kx$`),
  c('cl5', 'calculus', 'p2.9', 'P7.2', L`$\dfrac{d}{dx}(a^{kx})$`, L`$a^{kx}k\ln a$`),
  c('cl6', 'calculus', 'p2.9', 'P7.2', L`$\dfrac{d}{dx}(\tan kx)$: is it in the booklet?`, L`Yes: $k\sec^2kx$. So are $\sec kx$, $\cot kx$ and $\operatorname{cosec} kx$. $\sin$, $\cos$, $e^{kx}$ and $\ln x$ are NOT.`, 'booklet'),
  c('cl7', 'calculus', 'p1.13', 'P8.2', L`$\displaystyle\int x^n\,dx$ $(n \ne -1)$`, L`$\dfrac{x^{n+1}}{n+1} + C$`),
  c('cl8', 'calculus', 'p2.11', 'P8.2', L`$\displaystyle\int \frac1x\,dx$`, L`$\ln|x| + C$`),
  c('cl9', 'calculus', 'p2.11', 'P8.2', L`$\displaystyle\int e^{kx}\,dx$`, L`$\dfrac1ke^{kx} + C$`),
  c('cl10', 'calculus', 'p2.11', 'P8.2', L`$\displaystyle\int \sin kx\,dx$`, L`$-\dfrac1k\cos kx + C$`),
  c('cl11', 'calculus', 'p2.11', 'P8.2', L`$\displaystyle\int \cos kx\,dx$`, L`$\dfrac1k\sin kx + C$`),
  c('cl12', 'calculus', 'p2.11', 'P8.2', L`$\displaystyle\int \frac{f'(x)}{f(x)}\,dx$`, L`$\ln|f(x)| + C$`),
  c('cl13', 'calculus', 'p2.11', 'P8.2', L`$\displaystyle\int f'(x)\big(f(x)\big)^n\,dx$`, L`$\dfrac{\big(f(x)\big)^{n+1}}{n+1} + C$ (reverse chain rule; adjust the constant).`),
  c('cl14', 'calculus', 'p2.11', 'P8.2', L`$\displaystyle\int \sec^2kx\,dx$ and $\displaystyle\int \tan kx\,dx$: are they in the booklet?`, L`Yes: $\frac1k\tan kx$ and $\frac1k\ln|\sec kx|$. Integration by parts is in the booklet too.`, 'booklet'),
  c('cl15', 'calculus', 'p2.11', 'P8.2', L`How to integrate $\sin^2x$ or $\cos^2x$`, L`Use $\cos2x$: $\sin^2x = \frac12(1 - \cos2x)$ and $\cos^2x = \frac12(1 + \cos2x)$.`),
  c('cl16', 'calculus', 'p2.9', 'P7.1', 'Convex and concave in terms of the second derivative', L`Convex: $f''(x) \ge 0$. Concave: $f''(x) \le 0$. Point of inflection: $f''(x)$ changes sign.`),
]

const command: Item[] = [
  c('cw1', 'command', 'x.general', 'P1.1', '"Show that…"', 'The answer is given, so every step of working must be written out. No marks for calculator-only work. Finish by stating the printed result.'),
  c('cw2', 'command', 'x.general', 'P1.1', '"Hence…"', 'You must use the result from the previous part. A different method may score no marks.'),
  c('cw3', 'command', 'x.general', 'P1.1', '"Hence or otherwise…"', 'Using the previous part is the intended (usually quickest) route, but any valid method earns the marks.'),
  c('cw4', 'command', 'x.general', 'P1.1', '"Exact"', L`Leave the answer in surds, fractions, $\pi$, $e$ or $\ln$ form. A decimal loses the mark.`),
  c('cw5', 'command', 'x.general', 'P1.1', '"Prove"', 'A complete logical argument covering all cases, with every step justified and a concluding statement. Examples are not a proof.'),
  c('cw6', 'command', 'x.general', 'P1.1', '"Solutions relying entirely on calculator technology are not acceptable"', 'You must show the algebraic method (e.g. the factorised quadratic or the integration). Use the calculator only to check.'),
  c('cw7', 'command', 'x.general', 'P1.1', '"Sketch"', 'Show the general shape and label key features: intercepts with the axes, turning points and asymptotes. Not to scale.'),
  c('cw8', 'command', 'x.general', 'P1.1', '"Write down" or "State"', 'No working is needed; the answer should come from inspection or one mental step.'),
  c('cw9', 'command', 'x.general', 'P1.1', '"Determine" or "Find"', 'Working is expected. Marks are given for the method as well as the answer.'),
  c('cw10', 'command', 'x.general', 'P1.1', 'Default accuracy when a question does not say', '3 significant figures (angles in degrees to 1 decimal place). With $g = 9.8$, give 2 or 3 significant figures. Never round in the middle of a calculation.'),
  c('cw11', 'command', 'x.general', 'P1.1', L`The symbol $\equiv$`, 'An identity: true for every value of the variable, not just some. You can compare coefficients or substitute any value.'),
  c('cw12', 'command', 'x.general', 'P1.1', '"Verify"', 'Substitute the given value and show it works. Less demanding than "show that" or "solve".'),
  c('cw13', 'command', 'x.general', 'P1.1', '"In the context of the model" / "interpret"', 'Refer to the real situation and its units (e.g. "the initial number of bacteria"), not just the algebra.'),
  c('cw14', 'command', 'x.general', 'P1.1', '"Deduce"', 'Use what you have just found, with little extra working.'),
  c('cw15', 'command', 'p2.2', 'P2.8', 'Domain and range of a function', 'Domain: the set of allowed inputs. Range: the set of possible outputs.'),
  c('cw16', 'command', 'p2.2', 'P2.8', 'When does a function have an inverse?', 'Only when it is one-to-one. The graph of the inverse is the reflection in $y = x$.'),
]

const mechModel: Item[] = [
  c('mm1', 'mech-model', 'm1.8', 'M6.1', 'Particle', 'Mass concentrated at a point. Ignore dimensions, rotation and air resistance.'),
  c('mm2', 'mech-model', 'm1.8', 'M6.1', 'Light (string, rod, pulley)', 'Has no mass. For a string: the tension is the same at both ends.'),
  c('mm3', 'mech-model', 'm1.8', 'M6.1', 'Inextensible string', 'Does not stretch, so connected particles have the same speed and the same magnitude of acceleration.'),
  c('mm4', 'mech-model', 'm1.8', 'M6.1', 'Smooth surface or pulley', 'No friction. For a pulley: the tension is the same on both sides.'),
  c('mm5', 'mech-model', 'm1.8', 'M6.1', 'Rough surface', 'Friction acts, opposing motion or the tendency to move.'),
  c('mm6', 'mech-model', 'm1.8', 'M6.1', 'Rod', 'All mass along a line; rigid (does not bend). It can be in tension or in thrust.'),
  c('mm7', 'mech-model', 'm1.8', 'M6.1', 'Uniform body', 'Mass is evenly spread, so the weight acts at the centre (the midpoint of a uniform rod).'),
  c('mm8', 'mech-model', 'm1.8', 'M6.1', 'Lamina', 'A flat object whose thickness is ignored.'),
  c('mm9', 'mech-model', 'm1.8', 'M6.1', 'Peg', 'A fixed support from which a body can hang or on which it can rest. Usually smooth unless told otherwise.'),
  c('mm10', 'mech-model', 'm1.8', 'M6.1', 'Bead and wire', 'A particle with a hole in it, threaded on a thin rigid wire. Smooth unless told otherwise.'),
  c('mm11', 'mech-model', 'm1.8', 'M6.1', L`Gravity in the model`, L`Constant, vertically downwards, $g = 9.8$ m s$^{-2}$ unless told otherwise (so answers to 2 or 3 s.f.).`),
  c('mm12', 'mech-model', 'm1.8', 'M6.1', 'Typical refinement of a model', 'Include air resistance; allow for the size or rotation of the object; include the mass of the string or the friction at a pulley; use a more accurate value of $g$.'),
]

const hypWording: Item[] = [
  c('hw1', 'hyp-wording', 's1.7', 'S5.1', 'How to write hypotheses for a binomial test', L`$H_0: p = \dots$ and $H_1: p < \dots$, $p > \dots$ or $p \ne \dots$. Use the parameter $p$, never $x$ or words alone.`),
  c('hw2', 'hyp-wording', 's1.7', 'S5.1', 'The conclusion when the result is significant', '"There is sufficient evidence to reject $H_0$" followed by a sentence in context, e.g. "there is evidence that the proportion of faulty items has decreased".'),
  c('hw3', 'hyp-wording', 's1.7', 'S5.1', 'The conclusion when the result is NOT significant', '"There is insufficient evidence to reject $H_0$", then context. Never write "accept $H_0$" or "this proves".'),
  c('hw4', 'hyp-wording', 's1.7', 'S5.1', 'Test statistic', 'The result of the experiment, or a statistic calculated from the sample, used to make the decision.'),
  c('hw5', 'hyp-wording', 's1.7', 'S5.2', 'Actual significance level', 'The probability of the critical region under $H_0$ (for a discrete distribution it is usually less than the nominal level).'),
  c('hw6', 'hyp-wording', 's1.7', 'S5.2', 'One-tailed or two-tailed?', '"Increased", "decreased", "more", "less": one-tailed. "Changed", "different", "is the claim correct": two-tailed, with half the significance level in each tail.'),
  c('hw7', 'hyp-wording', 's2.1', 'S5.1', 'Hypotheses for a correlation test', L`$H_0: \rho = 0$; $H_1: \rho > 0$, $\rho < 0$ or $\rho \ne 0$. Compare $r$ with the critical value from the table for the sample size.`),
  c('hw8', 'hyp-wording', 's2.3', 'S5.3', 'Distribution of the sample mean', L`If $X \sim N(\mu, \sigma^2)$ then $\bar X \sim N\left(\mu, \dfrac{\sigma^2}{n}\right)$.`, 'booklet'),
  c('hw9', 'hyp-wording', 's2.3', 'S5.3', 'Hypotheses for a test of a normal mean', L`$H_0: \mu = \dots$; $H_1: \mu > \dots$, $\mu < \dots$ or $\mu \ne \dots$.`),
  c('hw10', 'hyp-wording', 's1.7', 'S5.1', 'What a significance level of 5% means', 'If $H_0$ is true, there is a 5% chance of wrongly rejecting it.'),
  c('hw11', 'hyp-wording', 's1.7', 'S5.2', 'Which probability do you calculate for an observed value $x$ in an upper-tail test?', L`$P(X \ge x)$, the observed value or more extreme. Never $P(X = x)$.`),
  c('hw12', 'hyp-wording', 's2.3', 'S5.3', 'Critical $z$ values worth knowing', '5% one-tailed: 1.6449. 5% two-tailed (2.5% each tail): 1.96. 1% one-tailed: 2.3263. They are in the percentage points table.', 'booklet'),
]

const lds: Item[] = [
  c('ld1', 'lds', 's1.1', 'S1.1', 'The five UK weather stations in the Large Data Set', 'Camborne, Heathrow, Hurn, Leeming and Leuchars.'),
  c('ld2', 'lds', 's1.1', 'S1.1', 'The three overseas weather stations', 'Beijing (China), Jacksonville (Florida, USA) and Perth (Australia).'),
  c('ld3', 'lds', 's1.1', 'S1.1', 'The time periods covered', 'May to October 1987 and May to October 2015.'),
  c('ld4', 'lds', 's1.1', 'S1.1', 'Why is Perth different from the other stations?', 'It is in the southern hemisphere, so May to October is its winter: temperatures fall towards the middle of the period and rise again.'),
  c('ld5', 'lds', 's1.1', 'S1.1', 'Units of daily mean windspeed', 'Knots (1 knot = 1.15 mph). It is also given on the Beaufort scale, a qualitative scale (Calm, Light, Moderate, Fresh…).'),
  c('ld6', 'lds', 's1.1', 'S1.1', 'Units of daily mean cloud cover', 'Oktas: eighths of the sky covered, from 0 to 8. Discrete.'),
  c('ld7', 'lds', 's1.1', 'S1.1', 'What does "tr" mean in the rainfall column?', 'Trace: less than 0.05 mm of rain. It must be treated (usually as 0) before calculating.'),
  c('ld8', 'lds', 's1.1', 'S1.1', 'What does "n/a" mean and what should you do?', 'The reading is not available. Clean the data: leave those values out and say so.'),
  c('ld9', 'lds', 's1.1', 'S1.1', 'Units of daily mean visibility', 'Decametres (Dm): 1 Dm = 10 m.'),
  c('ld10', 'lds', 's1.1', 'S1.1', 'Units of daily mean pressure', 'Hectopascals (hPa), the same as millibars. Typical values are around 1000.'),
  c('ld11', 'lds', 's1.1', 'S1.1', 'Units of daily maximum relative humidity', 'A percentage. Values above about 95% are associated with mist and fog.'),
  c('ld12', 'lds', 's1.1', 'S1.1', 'Daily mean wind direction', 'Given as a bearing in degrees (and as a cardinal direction). It is the direction the wind blows FROM.'),
  c('ld13', 'lds', 's1.1', 'S1.1', 'Which variables are recorded for the overseas stations?', 'Fewer than for the UK: daily mean temperature, daily total rainfall, daily mean pressure and daily mean windspeed.'),
  c('ld14', 'lds', 's1.1', 'S1.1', 'Roughly where are the UK stations?', 'Leuchars: east coast of Scotland. Leeming: North Yorkshire. Heathrow: London. Hurn: south coast near Bournemouth. Camborne: Cornwall. Coastal stations tend to be windier.'),
  c('ld15', 'lds', 's1.1', 'S1.1', 'Do you take the Large Data Set into the exam?', 'No, and you do not need to know individual values. Questions assume you know the context: stations, variables, units and typical behaviour.'),
  c('ld16', 'lds', 's1.1', 'S1.1', 'Is daily total sunshine recorded for every station?', 'No. Sunshine (in hours), maximum gust, cloud cover, visibility, humidity and wind direction are UK-only variables.'),
]

const calc: Item[] = [
  c('ca1', 'calc', 's1.6', 'S4.1', L`fx-991CW: find $P(X = 4)$ for $X \sim B(12, 0.3)$`, L`HOME → Distribution → Binomial PD → Variable → $x = 4$, $N = 12$, $p = 0.3$ → EXE. Answer $0.231$. (fx-CG100: Distribution app → Binomial → PD.) For CHECKING: still write the distribution and the probability statement.`),
  c('ca2', 'calc', 's1.6', 'S4.1', L`fx-991CW: find $P(X \le 4)$ for $X \sim B(12, 0.3)$`, L`HOME → Distribution → Binomial CD → Variable → $x = 4$, $N = 12$, $p = 0.3$ → EXE. Answer $0.724$. CD always gives $P(X \le x)$.`),
  c('ca3', 'calc', 's1.6', 'S4.1', L`Calculator: $P(X \ge 5)$ for a binomial`, L`Binomial CD only gives "at most". Use $1 - P(X \le 4)$: enter $x = 4$ and subtract from 1.`),
  c('ca4', 'calc', 's2.3', 'S4.2', L`fx-991CW: find $P(45 < X < 60)$ for $X \sim N(50, 8^2)$`, L`HOME → Distribution → Normal CD → Lower $= 45$, Upper $= 60$, $\sigma = 8$, $\mu = 50$ → EXE. Answer $0.628$. Enter $\sigma$, not $\sigma^2$.`),
  c('ca5', 'calc', 's2.3', 'S4.2', L`Calculator: $P(X > 60)$ for a normal distribution`, L`Normal CD with Lower $= 60$ and a very large Upper value such as $10^{99}$ (or $\mu + 10\sigma$).`),
  c('ca6', 'calc', 's2.3', 'S4.2', L`fx-991CW: find $a$ where $P(X < a) = 0.9$, $X \sim N(50, 8^2)$`, L`HOME → Distribution → Inverse Normal → Area $= 0.9$, $\sigma = 8$, $\mu = 50$ → EXE. Answer $60.3$. The area is always the LEFT tail: for $P(X > a) = 0.9$ enter $0.1$.`),
  c('ca7', 'calc', 'p2.10', 'P9.2', 'Calculator: iterating $x_{n+1} = g(x_n)$ quickly', 'Type the starting value and press EXE. Then type the formula using Ans in place of $x_n$ and press EXE repeatedly. Each press gives the next iterate.'),
  c('ca8', 'calc', 'p2.10', 'P9.1', 'Calculator: showing a change of sign over an interval', 'HOME → Table → define $f(x)$ → set Table Range (Start, End, Step). Read off where $f(x)$ changes sign. You must still write the two values and "change of sign, $f$ continuous, so root".'),
  c('ca9', 'calc', 'p1.2', 'P2.3', 'fx-991CW: solving a quadratic or cubic to check', 'HOME → Equation → Polynomial → choose the degree → enter the coefficients → EXE. For a quadratic it also gives the turning point. Checking only: "show that" and "use algebra" questions need full working.'),
  c('ca10', 'calc', 'p1.3', 'P2.4', 'fx-991CW: simultaneous linear equations', 'HOME → Equation → Simul Equation → number of unknowns → enter the coefficients.'),
  c('ca11', 'calc', 'p1.13', 'P8.3', 'Calculator: checking a definite integral', 'In Calculate, insert the integral template (CATALOG → Func Analysis → Integration on the fx-991CW), enter the function and limits, press EXE. Use it to check your exact answer by comparing decimals. Radians for trig.'),
  c('ca12', 'calc', 'p1.12', 'P7.2', 'Calculator: checking a gradient at a point', 'Insert the derivative template (CATALOG → Func Analysis → Derivative), enter the function and the $x$-value. Compare with your $\\frac{dy}{dx}$ evaluated at that point.'),
  c('ca13', 'calc', 's1.2', 'S2.3', 'fx-991CW: mean and standard deviation from a list', 'HOME → Statistics → 1-Variable → enter the data (turn Frequency on in the tools menu for a frequency table) → EXE → 1-Var Results. Use $\\sigma_x$ (not $s_x$) for the standard deviation in this course.'),
  c('ca14', 'calc', 's1.4', 'S2.2', 'fx-991CW: regression line and correlation coefficient', 'HOME → Statistics → 2-Variable → enter $x$ and $y$ → Reg Results → $y = a + bx$. It gives $a$, $b$ and $r$.'),
  c('ca15', 'calc', 'p1.14', 'P6.5', 'fx-991CW: solving an equation numerically (Solver)', 'HOME → Equation → Solver → type the equation with $x$ → EXE, give a starting value → EXE. It finds ONE root near the start value, so vary the start to find others. Checking only.'),
  c('ca16', 'calc', 'p1.10', 'P5.7', 'Before any trig question on the calculator', 'Check the angle unit (Settings → Calc Settings → Angle Unit). Degrees for $^\\circ$, radians for anything with $\\pi$ and for ALL calculus.'),
  c('ca17', 'calc', 's1.7', 'S5.2', 'Calculator: finding a binomial critical region', 'Use Binomial CD with the List option (or the Table app with the CD function) to see $P(X \\le x)$ for several $x$ at once. Write down the two probabilities either side of the significance level.'),
  c('ca18', 'calc', 'p1.9', 'P5.3', 'fx-CG100: using the graph to check solutions', 'Graph&Table app → enter both sides as $Y1$ and $Y2$ → draw → use the intersection tool. Use it to check how many solutions lie in the range and their rough values.'),
]

export const DECK_CARDS: Item[] = [...trigCards, ...radCards, ...notInBooklet, ...calculus, ...command, ...mechModel, ...hypWording, ...lds, ...calc]
