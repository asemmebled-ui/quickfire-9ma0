/** Parameterised generators: Statistics and Mechanics. g = 9.8 m s^-2, so answers are checked to 2 s.f. (3 s.f. also accepted). */
import { binomCdf, binomPmf, invNorm, normCdf } from '../lib/stats'
import { fmt, fmtSf, fr, sg } from './build'
import { L, makeRegistry } from './gen-core'

const { list, g } = makeRegistry()
export const APPLIED_GENERATORS = list
const G = 9.8
const rad = (d: number) => (d * Math.PI) / 180
const dec = (x: number, dp = 2) => `Rational(${Math.round(x * 10 ** dp)},${10 ** dp})`
const GNOTE = ' (Using $g = 9.8$, give 2 or 3 significant figures.)'

// ================= Statistics =================
g('stratified', 's1.1', 'S1.1', 1, 'Stratified sampling', (r, q) => {
  const k = r.pick([5, 8, 10, 20]), parts = [r.int(3, 12), r.int(3, 12), r.int(3, 12)], sizes = parts.map((p) => p * k)
  const total = sizes.reduce((s, x) => s + x, 0), sample = total / k, i = r.int(0, 2)
  return q.num(L`A school has ${sizes[0]} students in Year 11, ${sizes[1]} in Year 12 and ${sizes[2]} in Year 13. A stratified sample of ${sample} students is taken. How many ${['Year 11', 'Year 12', 'Year 13'][i]} students should be in the sample?`, parts[i],
    L`Sampling fraction $= \frac{${sample}}{${total}}$. Number $= \frac{${sample}}{${total}} \times ${sizes[i]} = ${parts[i]}$.`,
    { exact: true, v: `Rational(${sample},${total})*${sizes[i]}`, err: 'Each stratum is sampled in proportion to its size, then chosen by simple random sampling within the stratum.' })
})

g('meansd', 's1.2', 'S2.3', 2, 'Mean and standard deviation from summary statistics', (r, q) => {
  const n = r.int(8, 25), xs = Array.from({ length: n }, () => r.int(5, 40))
  const sx = xs.reduce((s, x) => s + x, 0), sxx = xs.reduce((s, x) => s + x * x, 0), mean = sx / n, sd = Math.sqrt(sxx / n - mean * mean), askSd = r.next() < 0.65
  return q.num(L`For a set of $${n}$ values, $\sum x = ${sx}$ and $\sum x^2 = ${sxx}$. Find the ${askSd ? 'standard deviation' : 'mean'} to 3 significant figures.`, askSd ? sd : mean,
    L`$\bar{x} = \dfrac{${sx}}{${n}} = ${fmtSf(mean, 4)}$.` + (askSd ? L` $\sigma = \sqrt{\dfrac{\sum x^2}{n} - \bar{x}^2} = \sqrt{\dfrac{${sxx}}{${n}} - ${fmtSf(mean, 4)}^2} = ${fmtSf(sd)}$.` : ''),
    { v: askSd ? `sqrt(Rational(${sxx},${n}) - Rational(${sx},${n})**2)` : `Rational(${sx},${n})`, err: 'Use the unrounded mean inside the square root. It is mean of the squares minus square of the mean.', memo: 'booklet' })
})

g('coding', 's1.2', 'S2.3', 3, 'Coding', (r, q) => {
  const a = r.pick([10, 20, 50, 100, 500]), b = r.pick([2, 5, 10]), my = r.int(3, 30) / 2, sy = r.int(4, 30) / 4, askSd = r.next() < 0.5
  return q.num(L`Data are coded using $y = \dfrac{x - ${a}}{${b}}$. The coded data have mean $${my}$ and standard deviation $${sy}$. Find the ${askSd ? 'standard deviation' : 'mean'} of the original data $x$.`, askSd ? b * sy : b * my + a,
    askSd ? L`$x = ${b}y + ${a}$. Adding a constant does not change spread, so $\sigma_x = ${b} \times ${sy} = ${fmt(b * sy)}$.` : L`$x = ${b}y + ${a}$, so $\bar{x} = ${b} \times ${my} + ${a} = ${fmt(b * my + a)}$.`,
    { exact: true, tol: 1e-9, v: askSd ? `${b}*${dec(sy)}` : `${b}*${dec(my)}+${a}`, err: 'The standard deviation is only affected by the multiplication or division, never by the addition or subtraction.' })
})

g('interp', 's1.2', 'S2.3', 3, 'Median by linear interpolation', (r, q) => {
  const w = r.pick([5, 10, 20]), fs = [r.int(3, 12), r.int(8, 20), r.int(8, 20), r.int(3, 12)], n = fs.reduce((s, x) => s + x, 0)
  let cf = 0, i = 0
  while (cf + fs[i] < n / 2) { cf += fs[i]; i++ }
  const val = i * w + ((n / 2 - cf) / fs[i]) * w
  const row = (j: number) => L`${j * w} \le x < ${(j + 1) * w} & ${fs[j]}`
  return q.num(L`Estimate the median of this grouped data, using linear interpolation. Give 3 significant figures. $$\begin{array}{c|c} \text{Value } x & \text{Frequency} \\ \hline ${[0, 1, 2, 3].map(row).join(L` \\ `)} \end{array}$$`, val,
    L`$n = ${n}$, so the median is the $\frac{n}{2} = ${n / 2}$th value. Cumulative frequency before the class $${i * w} \le x < ${(i + 1) * w}$ is $${cf}$. Median $= ${i * w} + \dfrac{${n / 2} - ${cf}}{${fs[i]}} \times ${w} = ${fmtSf(val)}$.`,
    { v: `${i * w} + (Rational(${n},2) - ${cf})/${fs[i]}*${w}`, err: 'For grouped data use $\\frac{n}{2}$, not $\\frac{n+1}{2}$. Use the class WIDTH, not the upper boundary.' })
})

g('outlier', 's1.3', 'S2.4', 2, 'Outliers', (r, q) => {
  const q1 = r.int(10, 40), iqr = r.int(4, 20), q3 = q1 + iqr, upper = r.next() < 0.5
  return q.num(L`A data set has $Q_1 = ${q1}$ and $Q_3 = ${q3}$. An outlier is any value more than $1.5 \times \text{IQR}$ ${upper ? 'above $Q_3$' : 'below $Q_1$'}. Find the ${upper ? 'upper' : 'lower'} outlier boundary.`, upper ? q3 + 1.5 * iqr : q1 - 1.5 * iqr,
    L`IQR $= ${q3} - ${q1} = ${iqr}$. Boundary $= ${upper ? `${q3} + 1.5 \\times ${iqr}` : `${q1} - 1.5 \\times ${iqr}`} = ${fmt(upper ? q3 + 1.5 * iqr : q1 - 1.5 * iqr)}$.`,
    { exact: true, v: upper ? `${q3}+Rational(3,2)*(${q3}-${q1})` : `${q1}-Rational(3,2)*(${q3}-${q1})`, dia: { k: 'box', five: [q1 - iqr, q1, q1 + Math.round(iqr / 2), q3, q3 + iqr] }, err: 'The outlier rule is always given in the question. Use the one stated.' })
})

g('freqdens', 's1.3', 'S2.1', 2, 'Histograms', (r, q) => {
  const w1 = r.int(2, 5), h1 = r.int(2, 8), k = r.pick([2, 3, 4, 5]), w2 = r.int(1, 6), h2 = r.int(2, 9)
  return q.num(L`On a histogram, a bar of width $${w1}$ cm and height $${h1}$ cm represents $${w1 * h1 * k}$ people. Another bar is $${w2}$ cm wide and $${h2}$ cm high. How many people does it represent?`, w2 * h2 * k,
    L`Area is proportional to frequency. First bar: area $${w1 * h1}$ cm$^2$ for $${w1 * h1 * k}$ people, so $1$ cm$^2$ is $${k}$ people. Second bar: area $${w2 * h2}$ cm$^2 \to ${w2 * h2} \times ${k} = ${w2 * h2 * k}$ people.`,
    { exact: true, v: `Rational(${w1 * h1 * k}, ${w1}*${h1})*${w2}*${h2}`, err: 'On a histogram AREA represents frequency. Height is frequency density.' })
})

g('regress', 's1.4', 'S2.2', 2, 'Using a regression line', (r, q) => {
  const a = r.int(5, 40), b = r.pick([0.4, 0.8, 1.5, 2.5, -0.6, -1.2]), lo = r.int(5, 15), hi = lo + r.int(10, 25), x = r.int(lo + 1, hi - 1)
  return q.num(L`The regression line of $y$ on $x$ is $y = ${a} ${sg(b, 'x')}$, based on data with $${lo} \le x \le ${hi}$. Estimate $y$ when $x = ${x}$.`, a + b * x,
    L`$y = ${a} ${sg(b)} \times ${x} = ${fmt(a + b * x)}$. This is interpolation ($x = ${x}$ is inside the data range), so the estimate is reliable. The gradient means: for each unit increase in $x$, $y$ ${b > 0 ? 'increases' : 'decreases'} by $${Math.abs(b)}$.`,
    { exact: true, tol: 1e-9, v: `${a}+${dec(b)}*${x}`, err: 'Only use $y$ on $x$ to predict $y$ from $x$, and do not extrapolate beyond the data.' })
})

g('venn', 's1.5', 'S3.1', 2, 'Venn diagrams', (r, q) => {
  const ab = r.int(5, 20), a = ab + r.int(10, 30), b = ab + r.int(10, 30), out = 100 - (a + b - ab), neither = r.next() < 0.5
  return q.num(L`$P(A) = ${a / 100}$, $P(B) = ${b / 100}$ and $P(A \cap B) = ${ab / 100}$. Find $${neither ? "P(A' \\cap B')" : 'P(A \\cup B)'}$.`, neither ? out / 100 : (a + b - ab) / 100,
    L`$P(A \cup B) = P(A) + P(B) - P(A \cap B) = ${a / 100} + ${b / 100} - ${ab / 100} = ${(a + b - ab) / 100}$.` + (neither ? L` $P(A' \cap B') = 1 - P(A \cup B) = ${out / 100}$.` : ''),
    { exact: true, tol: 1e-9, v: neither ? `1-(${dec(a / 100)}+${dec(b / 100)}-${dec(ab / 100)})` : `${dec(a / 100)}+${dec(b / 100)}-${dec(ab / 100)}`,
      dia: { k: 'venn', a: `${(a - ab) / 100}`, b: `${(b - ab) / 100}`, ab: `${ab / 100}`, out: `${out / 100}` }, err: 'Subtract the intersection once, or it is counted twice.', memo: 'booklet' })
})

g('indep', 's1.5', 'S3.1', 2, 'Independent events', (r, q) => {
  const a = r.int(2, 8) / 10, b = r.int(2, 8) / 10
  return q.num(L`$A$ and $B$ are independent events with $P(A) = ${a}$ and $P(B) = ${b}$. Find $P(A \cup B)$.`, a + b - a * b,
    L`Independent: $P(A \cap B) = P(A)P(B) = ${fmt(a * b)}$. $P(A \cup B) = ${a} + ${b} - ${fmt(a * b)} = ${fmt(a + b - a * b)}$.`,
    { exact: true, tol: 1e-9, v: `${dec(a)}+${dec(b)}-${dec(a)}*${dec(b)}`, err: 'Independent means $P(A \\cap B) = P(A)P(B)$. Mutually exclusive means $P(A \\cap B) = 0$. They are different.' })
})

g('binpmf', 's1.6', 'S4.1', 2, 'Binomial: P(X = k)', (r, q) => {
  const n = r.int(6, 20), p = r.pick([0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.6]), k = r.int(1, Math.min(n - 1, Math.round(n * p) + 3))
  return q.num(L`$X \sim B(${n}, ${p})$. Find $P(X = ${k})$ to 3 significant figures.`, binomPmf(n, p, k),
    L`$P(X = ${k}) = \binom{${n}}{${k}}(${p})^{${k}}(${fmt(1 - p)})^{${n - k}} = ${fmtSf(binomPmf(n, p, k))}$. Calculator: Binomial PD with $x = ${k}$, $N = ${n}$, $p = ${p}$.`,
    { v: `binompdf(${n}, ${dec(p)}, ${k})`, err: 'PD is for exactly; CD is for "at most".', memo: 'booklet' })
})

g('bincdf', 's1.6', 'S4.1', 3, 'Binomial: cumulative probabilities', (r, q) => {
  const n = r.int(10, 30), p = r.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5]), m = Math.round(n * p), kind = r.int(0, 2), k = Math.max(1, m + r.int(-2, 2))
  if (kind === 0) return q.num(L`$X \sim B(${n}, ${p})$. Find $P(X \le ${k})$ to 3 significant figures.`, binomCdf(n, p, k), L`Binomial CD with $x = ${k}$: $P(X \le ${k}) = ${fmtSf(binomCdf(n, p, k))}$.`, { v: `binomcdf(${n}, ${dec(p)}, ${k})` })
  if (kind === 1) return q.num(L`$X \sim B(${n}, ${p})$. Find $P(X \ge ${k})$ to 3 significant figures.`, 1 - binomCdf(n, p, k - 1),
    L`$P(X \ge ${k}) = 1 - P(X \le ${k - 1}) = 1 - ${fmtSf(binomCdf(n, p, k - 1), 4)} = ${fmtSf(1 - binomCdf(n, p, k - 1))}$.`, { v: `1-binomcdf(${n}, ${dec(p)}, ${k - 1})`, err: L`"At least ${k}" is $1 - P(X \le ${k - 1})$, not $1 - P(X \le ${k})$.` })
  const hi = k + r.int(1, 3)
  return q.num(L`$X \sim B(${n}, ${p})$. Find $P(${k} < X \le ${hi})$ to 3 significant figures.`, binomCdf(n, p, hi) - binomCdf(n, p, k),
    L`$P(${k} < X \le ${hi}) = P(X \le ${hi}) - P(X \le ${k}) = ${fmtSf(binomCdf(n, p, hi), 4)} - ${fmtSf(binomCdf(n, p, k), 4)} = ${fmtSf(binomCdf(n, p, hi) - binomCdf(n, p, k))}$.`,
    { v: `binomcdf(${n}, ${dec(p)}, ${hi})-binomcdf(${n}, ${dec(p)}, ${k})`, err: 'Strict inequality: $X > k$ starts at $k + 1$, so subtract $P(X \\le k)$.' })
})

g('critical', 's1.7', 'S5.2', 4, 'Binomial test: critical region', (r, q) => {
  let n = 0, p = 0, lower = true, c = -1
  do {
    n = r.pick([20, 25, 30, 40]); p = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]); lower = r.next() < 0.5
    if (lower) { c = -1; while (binomCdf(n, p, c + 1) <= 0.05) c++ }
    else { c = n + 1; while (1 - binomCdf(n, p, c - 2) <= 0.05) c-- }
  } while (lower ? c < 0 : c > n)
  const pc = lower ? binomCdf(n, p, c) : 1 - binomCdf(n, p, c - 1), pn = lower ? binomCdf(n, p, c + 1) : 1 - binomCdf(n, p, c - 2)
  return q.num(L`$X \sim B(${n}, p)$. Test $H_0: p = ${p}$ against $H_1: p ${lower ? '<' : '>'} ${p}$ at the 5% significance level. The critical region is $X ${lower ? '\\le' : '\\ge'} c$. Find $c$.`, c,
    lower ? L`Under $H_0$: $P(X \le ${c}) = ${fmtSf(pc, 4)} \le 0.05$ but $P(X \le ${c + 1}) = ${fmtSf(pn, 4)} > 0.05$. So the critical region is $X \le ${c}$ and the actual significance level is ${fmtSf(pc * 100)}%.`
          : L`Under $H_0$: $P(X \ge ${c}) = 1 - P(X \le ${c - 1}) = ${fmtSf(pc, 4)} \le 0.05$ but $P(X \ge ${c - 1}) = ${fmtSf(pn, 4)} > 0.05$. So the critical region is $X \ge ${c}$ and the actual significance level is ${fmtSf(pc * 100)}%.`,
    { exact: true, v: lower ? `crit_lower(${n}, ${dec(p)}, 0.05)` : `crit_upper(${n}, ${dec(p)}, 0.05)`, err: 'Show BOTH probabilities either side of the boundary. For an upper tail use $1 - P(X \\le c - 1)$.' })
})

g('pvalue', 's1.7', 'S5.2', 3, 'Binomial test: p-value and conclusion', (r, q) => {
  const n = r.pick([15, 20, 25, 30]), p = r.pick([0.2, 0.25, 0.3, 0.4]), x = Math.round(n * p) + r.int(2, 5), pv = 1 - binomCdf(n, p, x - 1), rej = pv < 0.05
  return q.num(L`A test of $H_0: p = ${p}$ against $H_1: p > ${p}$ uses $X \sim B(${n}, p)$ at the 5% level. The observed value is $x = ${x}$. Find the $p$-value $P(X \ge ${x})$ to 3 significant figures.`, pv,
    L`$P(X \ge ${x}) = 1 - P(X \le ${x - 1}) = ${fmtSf(pv)}$. This is ${rej ? 'less' : 'greater'} than 0.05, so ${rej ? 'reject $H_0$: there is sufficient evidence that $p$ has increased' : 'do not reject $H_0$: there is insufficient evidence that $p$ has increased'}. Always finish with a conclusion in the context of the question.`,
    { v: `1-binomcdf(${n}, ${dec(p)}, ${x - 1})`, err: 'The test uses the tail "this value or more extreme", never $P(X = x)$ alone.' })
})

g('expreg', 's2.1', 'S2.2', 3, 'Exponential models from coded regression', (r, q) => {
  const a = r.pick([0.3, 0.5, 0.8, 1.1, 1.4]), b = r.pick([0.05, 0.1, 0.15, 0.2, 0.25]), x = r.int(2, 9), val = Math.pow(10, a + b * x)
  return q.num(L`The regression line for coded data is $\log_{10} y = ${a} + ${b}x$. Estimate $y$ when $x = ${x}$, to 3 significant figures.`, val,
    L`$\log_{10} y = ${a} + ${b} \times ${x} = ${fmt(a + b * x)}$, so $y = 10^{${fmt(a + b * x)}} = ${fmtSf(val)}$. In the form $y = ab^x$: $a = 10^{${a}}$, $b = 10^{${b}}$.`,
    { v: `10**(${dec(a)}+${dec(b)}*${x})`, err: 'Undo the log at the end: $y = 10^{(\\dots)}$.' })
})

g('pmcc', 's2.1', 'S5.1', 3, 'Testing a correlation coefficient', (r, q) => {
  const [n, cv] = r.pick([[8, 0.6215], [10, 0.5494], [12, 0.4973], [15, 0.4409], [20, 0.3783], [25, 0.3365]]), rej = r.next() < 0.5
  const rv = +(cv + (rej ? 1 : -1) * r.int(3, 15) / 100).toFixed(3)
  const A = 'Reject $H_0$: there is evidence of positive correlation', B = 'Do not reject $H_0$: there is insufficient evidence of positive correlation'
  return q.mcq(L`For a sample of size $${n}$, the product moment correlation coefficient is $r = ${rv}$. Test $H_0: \rho = 0$ against $H_1: \rho > 0$ at the 5% level. The critical value from the table is $${cv}$. What is the conclusion?`,
    [rej ? A : B, rej ? B : A, 'Reject $H_0$: there is evidence that $x$ causes $y$', 'The test cannot be carried out without the raw data'],
    L`Compare $r$ with the critical value: $${rv} ${rej ? '>' : '<'} ${cv}$, so ${rej ? '$r$ is in the critical region. ' + A : '$r$ is not in the critical region. ' + B}. Correlation never shows causation.`,
    { v: { s: `Integer(${rv} > ${cv})`, val: rej ? 1 : 0 }, err: 'Hypotheses are about $\\rho$ (the population), not $r$. Conclude in context and never claim causation.' })
})

g('cond', 's2.2', 'S3.2', 3, 'Conditional probability', (r, q) => {
  const p = r.int(2, 7) / 10, q1 = r.int(2, 9) / 10, q2 = r.pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6].filter((x) => x !== q1)), val = (p * q1) / (p * q1 + (1 - p) * q2)
  const f = (x: number) => fmt(+x.toFixed(4))
  return q.num(L`$P(A) = ${p}$, $P(B \mid A) = ${q1}$ and $P(B \mid A') = ${q2}$. Find $P(A \mid B)$ to 3 significant figures.`, val,
    L`$P(A \cap B) = ${p} \times ${q1} = ${f(p * q1)}$. $P(B) = ${f(p * q1)} + ${f(1 - p)} \times ${q2} = ${f(p * q1 + (1 - p) * q2)}$. $P(A \mid B) = \dfrac{P(A \cap B)}{P(B)} = \dfrac{${f(p * q1)}}{${f(p * q1 + (1 - p) * q2)}} = ${fmtSf(val)}$.`,
    { v: `${dec(p)}*${dec(q1)}/(${dec(p)}*${dec(q1)}+(1-${dec(p)})*${dec(q2)})`, dia: { k: 'tree', l1: [['A', `${p}`], ["A'", f(1 - p)]], l2: [[['B', `${q1}`], ["B'", f(1 - q1)]], [['B', `${q2}`], ["B'", f(1 - q2)]]] },
      err: 'The denominator is the total probability of the GIVEN event, from both branches.', memo: 'booklet' })
})

g('normprob', 's2.3', 'S4.2', 2, 'Normal probabilities', (r, q) => {
  const mu = r.pick([20, 50, 64, 100, 170]), sd = r.pick([2, 4, 5, 8, 10, 15]), kind = r.int(0, 2)
  const z1 = r.int(-20, 5) / 10, z2 = z1 + r.int(5, 20) / 10, a = +(mu + z1 * sd).toFixed(1), b = +(mu + z2 * sd).toFixed(1)
  const head = L`$X \sim N(${mu}, ${sd}^2)$. `
  if (kind === 0) return q.num(head + L`Find $P(X < ${a})$ to 3 significant figures.`, normCdf(a, mu, sd), L`Normal CD: lower $= -10^{99}$, upper $= ${a}$, $\sigma = ${sd}$, $\mu = ${mu}$. $P(X < ${a}) = ${fmtSf(normCdf(a, mu, sd))}$.`,
    { v: `normcdf(${dec(a, 1)}, ${mu}, ${sd})`, dia: { k: 'normal', hi: (a - mu) / sd, labels: [[(a - mu) / sd, `${a}`], [0, `${mu}`]] }, err: 'The calculator wants $\\sigma$, not $\\sigma^2$.' })
  if (kind === 1) return q.num(head + L`Find $P(X > ${b})$ to 3 significant figures.`, 1 - normCdf(b, mu, sd), L`Normal CD: lower $= ${b}$, upper $= 10^{99}$. $P(X > ${b}) = ${fmtSf(1 - normCdf(b, mu, sd))}$.`,
    { v: `1-normcdf(${dec(b, 1)}, ${mu}, ${sd})`, dia: { k: 'normal', lo: (b - mu) / sd, labels: [[(b - mu) / sd, `${b}`], [0, `${mu}`]] }, err: 'Sketch the curve and shade: is the answer more or less than 0.5?' })
  return q.num(head + L`Find $P(${a} < X < ${b})$ to 3 significant figures.`, normCdf(b, mu, sd) - normCdf(a, mu, sd), L`Normal CD: lower $= ${a}$, upper $= ${b}$. $P = ${fmtSf(normCdf(b, mu, sd) - normCdf(a, mu, sd))}$.`,
    { v: `normcdf(${dec(b, 1)}, ${mu}, ${sd})-normcdf(${dec(a, 1)}, ${mu}, ${sd})`, dia: { k: 'normal', lo: (a - mu) / sd, hi: (b - mu) / sd, labels: [[(a - mu) / sd, `${a}`], [(b - mu) / sd, `${b}`]] } })
})

g('norminv', 's2.3', 'S4.2', 3, 'Inverse normal', (r, q) => {
  const mu = r.pick([30, 50, 72, 100, 250]), sd = r.pick([3, 5, 6, 10, 12]), p = r.pick([0.1, 0.2, 0.25, 0.6, 0.75, 0.8, 0.9, 0.95]), gt = r.next() < 0.4
  const val = invNorm(gt ? 1 - p : p, mu, sd)
  return q.num(L`$X \sim N(${mu}, ${sd}^2)$ and $P(X ${gt ? '>' : '<'} a) = ${p}$. Find $a$ to 3 significant figures.`, val,
    (gt ? L`$P(X > a) = ${p}$ means $P(X < a) = ${fmt(1 - p)}$. ` : '') + L`Inverse Normal: area $= ${fmt(gt ? 1 - p : p)}$, $\sigma = ${sd}$, $\mu = ${mu}$ gives $a = ${fmtSf(val)}$.`,
    { v: `invnorm(${dec(gt ? 1 - p : p)}, ${mu}, ${sd})`, err: 'Inverse Normal needs the area to the LEFT.' })
})

g('normsigma', 's2.3', 'S4.2', 4, 'Finding σ from a probability', (r, q) => {
  const mu = r.pick([40, 60, 100, 500]), [p, z] = r.pick([[0.1, 1.2816], [0.05, 1.6449], [0.025, 1.96], [0.01, 2.3263]]), d = r.pick([4, 6, 8, 10, 15]), val = d / invNorm(1 - p)
  return q.num(L`$X \sim N(${mu}, \sigma^2)$ and $P(X > ${mu + d}) = ${p}$. Find $\sigma$ to 3 significant figures.`, val,
    L`From the percentage points table, $P(Z > z) = ${p}$ gives $z = ${z}$. Standardise: $\dfrac{${mu + d} - ${mu}}{\sigma} = ${z} \Rightarrow \sigma = \dfrac{${d}}{${z}} = ${fmtSf(val)}$.`,
    { v: `${d}/invnorm(1-${dec(p, 3)}, 0, 1)`, err: 'Use $z = \\frac{x - \\mu}{\\sigma}$ with the $z$ value from the table (4 d.p.), with the correct sign.', memo: 'memorise' })
})

g('normapprox', 's2.3', 'S4.3', 4, 'Normal approximation to the binomial', (r, q) => {
  const n = r.pick([80, 100, 120, 150, 200]), p = r.pick([0.4, 0.45, 0.5, 0.55, 0.6]), mu = n * p, sd = Math.sqrt(n * p * (1 - p)), k = Math.round(mu + r.int(-8, 8)), le = r.next() < 0.5
  const val = le ? normCdf(k + 0.5, mu, sd) : 1 - normCdf(k - 0.5, mu, sd)
  return q.num(L`$X \sim B(${n}, ${p})$. Use a normal approximation with a continuity correction to estimate $P(X ${le ? '\\le' : '\\ge'} ${k})$, to 3 significant figures.`, val,
    L`$n$ is large and $p$ is close to 0.5, so $Y \sim N(np, np(1-p)) = N(${fmt(mu)}, ${fmt(+(sd * sd).toFixed(4))})$. Continuity correction: $P(X ${le ? '\\le' : '\\ge'} ${k}) \approx P(Y ${le ? '<' : '>'} ${le ? k + 0.5 : k - 0.5}) = ${fmtSf(val)}$.`,
    { v: le ? `normcdf(${k}+Rational(1,2), ${n}*${dec(p)}, sqrt(${n}*${dec(p)}*(1-${dec(p)})))` : `1-normcdf(${k}-Rational(1,2), ${n}*${dec(p)}, sqrt(${n}*${dec(p)}*(1-${dec(p)})))`,
      err: 'Include the whole bar for the integer: $X \\le k$ becomes $Y < k + 0.5$; $X \\ge k$ becomes $Y > k - 0.5$.' })
})

g('samplemean', 's2.3', 'S5.3', 4, 'Hypothesis test for a normal mean', (r, q) => {
  const mu = r.pick([50, 100, 250, 500]), sd = r.pick([4, 5, 8, 10]), n = r.pick([16, 25, 36, 40, 50]), xb = +(mu + (r.int(8, 30) / 10) * (sd / Math.sqrt(n))).toFixed(1)
  const pv = 1 - normCdf(xb, mu, sd / Math.sqrt(n)), rej = pv < 0.05
  return q.num(L`$X \sim N(\mu, ${sd}^2)$. A random sample of $${n}$ observations has mean $\bar{x} = ${xb}$. Test $H_0: \mu = ${mu}$ against $H_1: \mu > ${mu}$ at the 5% level by finding $P(\bar{X} > ${xb})$ to 3 significant figures.`, pv,
    L`Under $H_0$, $\bar{X} \sim N\left(${mu}, \frac{${sd}^2}{${n}}\right)$, so the standard deviation of $\bar{X}$ is $\frac{${sd}}{\sqrt{${n}}} = ${fmtSf(sd / Math.sqrt(n), 4)}$. $P(\bar{X} > ${xb}) = ${fmtSf(pv)}$, which is ${rej ? 'less than 0.05: reject $H_0$, there is evidence the mean has increased' : 'greater than 0.05: do not reject $H_0$, there is insufficient evidence the mean has increased'}.`,
    { v: `1-normcdf(${dec(xb, 1)}, ${mu}, ${sd}/sqrt(${n}))`, err: 'Use $\\frac{\\sigma}{\\sqrt{n}}$ for the sample mean, not $\\sigma$.', memo: 'booklet' })
})

// ================= Mechanics =================
g('units', 'm1.8', 'M6.1', 1, 'Converting units', (r, q) => {
  if (r.next() < 0.5) { const v = r.pick([18, 36, 54, 72, 90, 108, 45, 63]); return q.num(L`Convert $${v}$ km h$^{-1}$ to m s$^{-1}$.`, v / 3.6, L`$${v} \times \dfrac{1000}{3600} = ${fmt(v / 3.6)}$ m s$^{-1}$. (Divide by 3.6.)`, { exact: true, tol: 1e-9, unit: 'ms^-1', v: `Rational(${v}*1000, 3600)`, memo: 'memorise' }) }
  const d = r.pick([0.8, 1.2, 2.7, 7.9, 11.3])
  return q.num(L`Convert $${d}$ g cm$^{-3}$ to kg m$^{-3}$.`, d * 1000, L`$1$ g $= 10^{-3}$ kg and $1$ cm$^3 = 10^{-6}$ m$^3$, so multiply by $\dfrac{10^{-3}}{10^{-6}} = 1000$: $${fmt(d * 1000)}$ kg m$^{-3}$.`, { exact: true, tol: 1e-6, v: `${dec(d, 1)}*1000`, err: 'There are $100^3 = 10^6$ cm$^3$ in a m$^3$, not 100.' })
})

g('suvat', 'm1.9', 'M7.3', 2, 'Constant acceleration (suvat)', (r, q) => {
  const u = r.int(0, 20), a = r.pick([0.5, 1.5, 2, 2.5, 3, 4]), t = r.int(2, 10), kind = r.int(0, 3)
  if (kind === 0) return q.num(L`A particle starts with velocity $${u}$ m s$^{-1}$ and accelerates at $${a}$ m s$^{-2}$ for $${t}$ s. Find the distance travelled.`, u * t + 0.5 * a * t * t, L`$s = ut + \tfrac12at^2 = ${u}(${t}) + \tfrac12(${a})(${t})^2 = ${fmt(u * t + 0.5 * a * t * t)}$ m.`, { exact: true, tol: 1e-9, unit: 'm', v: `${u}*${t}+Rational(1,2)*${dec(a)}*${t}**2`, memo: 'booklet' })
  const s = r.int(10, 80)
  if (kind === 1) return q.num(L`A car accelerates uniformly at $${a}$ m s$^{-2}$ from $${u}$ m s$^{-1}$ over a distance of $${s}$ m. Find its final speed to 3 significant figures.`, Math.sqrt(u * u + 2 * a * s), L`$v^2 = u^2 + 2as = ${u * u} + 2(${a})(${s}) = ${fmt(u * u + 2 * a * s)}$, so $v = ${fmtSf(Math.sqrt(u * u + 2 * a * s))}$ m s$^{-1}$.`, { unit: 'ms^-1', v: `sqrt(${u}**2+2*${dec(a)}*${s})`, memo: 'booklet' })
  const v0 = r.int(10, 30)
  if (kind === 2) return q.num(L`A car travelling at $${v0}$ m s$^{-1}$ brakes with constant deceleration $${a}$ m s$^{-2}$. Find the distance it travels before stopping, to 3 significant figures.`, (v0 * v0) / (2 * a), L`$v^2 = u^2 + 2as$ with $v = 0$, $a = -${a}$: $0 = ${v0 * v0} - 2(${a})s \Rightarrow s = ${fmtSf((v0 * v0) / (2 * a))}$ m.`, { unit: 'm', v: `${v0}**2/(2*${dec(a)})`, err: 'Deceleration means $a$ is negative.' })
  return q.num(L`A particle moves in a straight line with constant acceleration. Its velocity changes from $${u}$ m s$^{-1}$ to $${u + a * t}$ m s$^{-1}$ in $${t}$ s. Find the distance travelled.`, ((u + u + a * t) / 2) * t, L`No $a$ needed: $s = \tfrac12(u + v)t = \tfrac12(${u} + ${u + a * t})(${t}) = ${fmt(((2 * u + a * t) / 2) * t)}$ m.`, { exact: true, tol: 1e-9, unit: 'm', v: `Rational(1,2)*(${u}+${dec(u + a * t)})*${t}` })
})

g('vertical', 'm1.9', 'M7.3', 3, 'Vertical motion under gravity', (r, q) => {
  const u = r.int(5, 25), h = r.int(5, 40), kind = r.int(0, 2)
  if (kind === 0) return q.num(L`A ball is thrown vertically upwards at $${u}$ m s$^{-1}$. Find the greatest height it reaches above the point of projection.` + GNOTE, (u * u) / (2 * G), L`At the top $v = 0$: $0 = ${u}^2 - 2(9.8)s \Rightarrow s = \dfrac{${u * u}}{19.6} = ${fmtSf((u * u) / (2 * G))}$ m.`, { sf: 2, unit: 'm', v: `${u}**2/(2*Rational(98,10))` })
  if (kind === 1) return q.num(L`A ball is thrown vertically upwards at $${u}$ m s$^{-1}$ from ground level. Find the time until it returns to the ground.` + GNOTE, (2 * u) / G, L`$s = 0$: $0 = ${u}t - 4.9t^2 \Rightarrow t = \dfrac{${u}}{4.9} = ${fmtSf((2 * u) / G)}$ s.`, { sf: 2, unit: 's', v: `max(solve(${u}*t-Rational(49,10)*t**2, t))` })
  const val = (u + Math.sqrt(u * u + 2 * G * h)) / G
  return q.num(L`A stone is thrown vertically upwards at $${u}$ m s$^{-1}$ from the top of a cliff ${h} m above the sea. Find the time it takes to reach the sea.` + GNOTE, val,
    L`Take up as positive, so $s = -${h}$: $-${h} = ${u}t - 4.9t^2 \Rightarrow 4.9t^2 - ${u}t - ${h} = 0$. The positive root is $t = ${fmtSf(val)}$ s.`, { sf: 2, unit: 's', v: `max(solve(Rational(49,10)*t**2-${u}*t-${h}, t))`, err: 'Displacement is negative when the stone ends below where it started.' })
})

g('vt', 'm1.9', 'M7.2', 2, 'Velocity–time graphs', (r, q) => {
  const V = r.int(6, 24), t1 = r.int(2, 8), t2 = r.int(5, 20), t3 = r.int(2, 8), val = V * (t1 / 2 + t2 + t3 / 2)
  return q.num(L`A train starts from rest, accelerates uniformly to $${V}$ m s$^{-1}$ in $${t1}$ s, travels at this speed for $${t2}$ s, then decelerates uniformly to rest in $${t3}$ s. Find the total distance travelled.`, val,
    L`Distance = area under the graph (a trapezium): $\tfrac12(${t2} + ${t1 + t2 + t3})(${V}) = ${fmt(val)}$ m.`,
    { exact: true, tol: 1e-9, unit: 'm', v: `Rational(1,2)*(${t2}+${t1 + t2 + t3})*${V}`, dia: { k: 'vt', pts: [[0, 0], [t1, V], [t1 + t2, V], [t1 + t2 + t3, 0]] }, err: 'Gradient is acceleration; area is displacement.', memo: 'memorise' })
})

g('fma', 'm1.10', 'M8.2', 2, 'F = ma', (r, q) => {
  const m = r.pick([400, 800, 1000, 1200, 1500]), D = r.int(10, 40) * 100, R = r.int(2, 9) * 100
  return q.num(L`A car of mass $${m}$ kg has a driving force of $${D}$ N and experiences a constant resistance of $${R}$ N on a horizontal road. Find its acceleration to 3 significant figures.`, (D - R) / m,
    L`Resultant force $= ${D} - ${R} = ${D - R}$ N. $F = ma \Rightarrow a = \dfrac{${D - R}}{${m}} = ${fmtSf((D - R) / m)}$ m s$^{-2}$.`, { unit: 'ms^-2', v: `Rational(${D}-${R}, ${m})`, err: '$F$ is the RESULTANT force, not just the driving force.', memo: 'memorise' })
})

g('lift', 'm1.10', 'M8.2,M8.3', 3, 'Lifts and normal reaction', (r, q) => {
  const m = r.int(40, 90), a = r.pick([0.5, 1, 1.5, 2, 2.5]), up = r.next() < 0.5, val = m * (G + (up ? a : -a))
  return q.num(L`A person of mass $${m}$ kg stands in a lift that is accelerating ${up ? 'upwards' : 'downwards'} at $${a}$ m s$^{-2}$. Find the normal reaction of the floor on the person.` + GNOTE, val,
    L`Taking ${up ? 'up' : 'down'} as positive: $${up ? `R - ${m}g` : `${m}g - R`} = ${m} \times ${a}$, so $R = ${m}(9.8 ${up ? '+' : '-'} ${a}) = ${fmtSf(val)}$ N.`, { sf: 2, unit: 'N', v: `${m}*(Rational(98,10)${up ? '+' : '-'}${dec(a)})`, err: 'Resolve in the direction of the acceleration.' })
})

g('pulley', 'm1.10', 'M8.4', 3, 'Connected particles over a pulley', (r, q) => {
  const m2 = r.int(1, 5), m1 = m2 + r.int(1, 5), askT = r.next() < 0.5, a = ((m1 - m2) * G) / (m1 + m2), T = (2 * m1 * m2 * G) / (m1 + m2)
  return q.num(L`Particles $A$ (mass $${m1}$ kg) and $B$ (mass $${m2}$ kg) are connected by a light inextensible string over a smooth fixed pulley and released from rest. Find the ${askT ? 'tension in the string' : 'acceleration of $A$'}.` + GNOTE, askT ? T : a,
    L`$A$ (down): $${m1}g - T = ${m1}a$. $B$ (up): $T - ${m2}g = ${m2}a$. Add: $${m1 - m2}g = ${m1 + m2}a \Rightarrow a = ${fmtSf(a)}$ m s$^{-2}$.` + (askT ? L` Then $T = ${m2}(g + a) = ${fmtSf(T)}$ N.` : ''),
    { sf: 2, unit: askT ? 'N' : 'ms^-2', v: askT ? `2*${m1}*${m2}*Rational(98,10)/(${m1}+${m2})` : `(${m1}-${m2})*Rational(98,10)/(${m1}+${m2})`, dia: { k: 'pulley', m1: `A ${m1} kg`, m2: `B ${m2} kg` },
      err: 'Write a separate equation of motion for each particle. The tension is the same throughout a light string over a smooth pulley.' })
})

g('varacc', 'm1.11', 'M7.4', 2, 'Variable acceleration: differentiate', (r, q) => {
  const a = r.nz(-2, 3), b = r.nz(-5, 6), c = r.int(-8, 8), t = r.int(1, 4), acc = r.next() < 0.5
  return q.num(L`A particle moves in a straight line. Its displacement from $O$ at time $t$ seconds is $s = ${[a, b, c, 0].reduce((s2, k, i) => s2 + (k ? ` ${s2 ? sg(k, ['t^3', 't^2', 't', ''][i]) : (k === 1 ? '' : k === -1 ? '-' : k) + ['t^3', 't^2', 't', ''][i]}` : ''), '').trim()}$ metres. Find its ${acc ? 'acceleration' : 'velocity'} when $t = ${t}$.`,
    acc ? 6 * a * t + 2 * b : 3 * a * t * t + 2 * b * t + c,
    L`$v = \dfrac{ds}{dt} = ${3 * a}t^2 ${sg(2 * b, 't')} ${c ? sg(c) : ''}$` + (acc ? L` and $a = \dfrac{dv}{dt} = ${6 * a}t ${sg(2 * b)}$. At $t = ${t}$: $a = ${6 * a * t + 2 * b}$ m s$^{-2}$.` : L`. At $t = ${t}$: $v = ${3 * a * t * t + 2 * b * t + c}$ m s$^{-1}$.`),
    { exact: true, v: `diff((${a})*t**3+(${b})*t**2+(${c})*t, t${acc ? ', 2' : ''}).subs(t, ${t})`, err: 'suvat does NOT apply when acceleration depends on $t$. Use calculus.', memo: 'memorise' })
})

g('varint', 'm1.11', 'M7.4', 3, 'Variable acceleration: integrate', (r, q) => {
  const a = 3 * r.nz(-2, 2), b = 2 * r.int(-4, 4), c = r.int(1, 9), T = r.int(1, 3)
  const s = (t: number) => (a / 3) * t ** 3 + (b / 2) * t * t + c * t
  return q.num(L`A particle moves in a straight line with velocity $v = ${a === 3 ? '' : a === -3 ? '-' : a}t^2 ${b ? sg(b, 't') : ''} + ${c}$ m s$^{-1}$ at time $t$ seconds. Find its displacement from its starting point when $t = ${T}$.`, s(T),
    L`$s = \displaystyle\int_0^{${T}} v\,dt = \left[${a / 3 === 1 ? '' : a / 3 === -1 ? '-' : a / 3}t^3 ${b ? sg(b / 2, 't^2') : ''} + ${c}t\right]_0^{${T}} = ${s(T)}$ m.`,
    { exact: true, unit: 'm', v: `integrate((${a})*t**2+(${b})*t+${c}, (t, 0, ${T}))`, err: 'Displacement is the integral of velocity. Distance needs care if $v$ changes sign.' })
})

g('beam', 'm2.4', 'M9.1', 3, 'Moments: reactions on a beam', (r, q) => {
  const Lb = r.pick([4, 5, 6, 8]), M = r.pick([10, 20, 30, 40]), m = r.pick([5, 10, 15, 20]), x = r.int(1, Lb - 1)
  const RB = (M * G * (Lb / 2) + m * G * x) / Lb, RA = (M + m) * G - RB, askA = r.next() < 0.5
  return q.num(L`A uniform beam $AB$ of length $${Lb}$ m and mass $${M}$ kg rests horizontally on supports at $A$ and $B$. A load of mass $${m}$ kg is placed $${x}$ m from $A$. Find the reaction at $${askA ? 'A' : 'B'}$.` + GNOTE, askA ? RA : RB,
    L`Moments about $A$: $R_B \times ${Lb} = ${M}g \times ${Lb / 2} + ${m}g \times ${x} \Rightarrow R_B = ${fmtSf(RB)}$ N.` + (askA ? L` Resolve vertically: $R_A = ${M + m}g - R_B = ${fmtSf(RA)}$ N.` : ''),
    { sf: 2, unit: 'N', v: askA ? `(${M}+${m})*Rational(98,10) - (${M}*Rational(98,10)*Rational(${Lb},2)+${m}*Rational(98,10)*${x})/${Lb}` : `(${M}*Rational(98,10)*Rational(${Lb},2)+${m}*Rational(98,10)*${x})/${Lb}`,
      dia: { k: 'beam', len: Lb, supports: [0, Lb], loads: [{ at: Lb / 2, label: `${M}g` }, { at: x, label: `${m}g` }] }, err: 'Uniform: the weight acts at the midpoint. Take moments about a support to remove its reaction.', memo: 'memorise' })
})

g('tilt', 'm2.4', 'M9.1', 4, 'Moments: on the point of tilting', (r, q) => {
  const Lb = r.pick([6, 8, 10]), M = r.pick([12, 20, 30, 40]), c = r.int(1, Lb / 2 - 1), d = Lb - r.int(1, Lb / 2 - 1)
  const val = (M * (d - Lb / 2)) / (Lb - d)
  return q.num(L`A uniform plank $AB$ of length $${Lb}$ m and mass $${M}$ kg rests on supports at $C$ and $D$, where $AC = ${c}$ m and $AD = ${d}$ m. A child stands at $B$ and the plank is on the point of tilting about $D$. Find the mass of the child, as an exact value in kg.`, val,
    L`On the point of tilting about $D$, the reaction at $C$ is zero. Moments about $D$: $${M}g \times (${d} - ${Lb / 2}) = mg \times (${Lb} - ${d}) \Rightarrow m = \dfrac{${M} \times ${fmt(d - Lb / 2)}}{${Lb - d}} = ${fr(M * (d - Lb / 2), Lb - d)}$ kg.`,
    { exact: true, tol: 1e-9, unit: 'kg', v: `Rational(${M}*(${d}-Rational(${Lb},2)), ${Lb}-${d})`, dia: { k: 'beam', len: Lb, supports: [c, d], loads: [{ at: Lb / 2, label: `${M}g` }, { at: Lb, label: 'mg' }] }, err: '"On the point of tilting about $D$" means the reaction at the OTHER support is zero.' })
})

g('resolve', 'm2.5', 'M8.5', 2, 'Resolving forces', (r, q) => {
  const F = r.int(5, 40), th = r.pick([20, 25, 30, 35, 40, 50, 60]), hor = r.next() < 0.5
  return q.num(L`A force of $${F}$ N acts at $${th}^\circ$ above the horizontal. Find its ${hor ? 'horizontal' : 'vertical'} component to 3 significant figures.`, hor ? F * Math.cos(rad(th)) : F * Math.sin(rad(th)),
    L`${hor ? 'Adjacent to the angle: $' + F + '\\cos ' + th + '^\\circ' : 'Opposite the angle: $' + F + '\\sin ' + th + '^\\circ'} = ${fmtSf(hor ? F * Math.cos(rad(th)) : F * Math.sin(rad(th)))}$ N.`,
    { unit: 'N', v: `${F}*${hor ? 'cos' : 'sin'}(rad(${th}))`, dia: { k: 'forces', forces: [{ deg: th, label: `${F} N` }] }, err: 'cos for the component next to the angle, sin for the component opposite it.', memo: 'memorise' })
})

g('incline', 'm2.5', 'M8.5,M8.6', 4, 'Rough inclined plane', (r, q) => {
  const al = r.pick([25, 30, 35, 40]), mu = r.pick([0.1, 0.2, 0.25, 0.3]), m = r.int(2, 8), kind = r.int(0, 1)
  if (kind === 0) { const val = G * (Math.sin(rad(al)) - mu * Math.cos(rad(al)))
    return q.num(L`A particle of mass $${m}$ kg slides down a rough plane inclined at $${al}^\circ$ to the horizontal. The coefficient of friction is $${mu}$. Find the acceleration of the particle.` + GNOTE, val,
      L`Perpendicular to the plane: $R = ${m}g\cos ${al}^\circ$. Friction $= \mu R = ${mu} \times ${m}g\cos ${al}^\circ$, acting up the plane. Down the plane: $${m}g\sin ${al}^\circ - ${mu}(${m}g\cos ${al}^\circ) = ${m}a \Rightarrow a = g(\sin ${al}^\circ - ${mu}\cos ${al}^\circ) = ${fmtSf(val)}$ m s$^{-2}$.`,
      { sf: 2, unit: 'ms^-2', v: `Rational(98,10)*(sin(rad(${al}))-${dec(mu)}*cos(rad(${al})))`, dia: { k: 'incline', angle: al, rough: true, forces: [{ dir: 'normal', label: 'R' }, { dir: 'weight', label: `${m}g` }, { dir: 'up', label: 'F' }] }, err: 'Friction opposes motion and uses $R = mg\\cos\\alpha$, not $mg$.', memo: 'memorise' }) }
  const val = m * G * (Math.sin(rad(al)) + mu * Math.cos(rad(al)))
  return q.num(L`A particle of mass $${m}$ kg is on a rough plane inclined at $${al}^\circ$ to the horizontal. The coefficient of friction is $${mu}$. A force $P$ N acts up the line of greatest slope and the particle is on the point of moving UP the plane. Find $P$.` + GNOTE, val,
    L`About to move up, so friction acts DOWN the plane and is limiting: $F = \mu R = ${mu} \times ${m}g\cos ${al}^\circ$. Along the plane: $P = ${m}g\sin ${al}^\circ + ${mu}(${m}g\cos ${al}^\circ) = ${fmtSf(val)}$ N.`,
    { sf: 2, unit: 'N', v: `${m}*Rational(98,10)*(sin(rad(${al}))+${dec(mu)}*cos(rad(${al})))`, dia: { k: 'incline', angle: al, rough: true, forces: [{ dir: 'normal', label: 'R' }, { dir: 'weight', label: `${m}g` }, { dir: 'up', label: 'P' }, { dir: 'down', label: 'F' }] }, err: 'Friction acts opposite to the direction the particle is about to move.' })
})

g('frichoriz', 'm2.5', 'M8.6', 3, 'Friction on a horizontal surface', (r, q) => {
  const m = r.int(2, 10), mu = r.pick([0.2, 0.25, 0.3, 0.4, 0.5]), th = r.pick([20, 30, 40]), P = Math.ceil((mu * m * G) / (Math.cos(rad(th)) + mu * Math.sin(rad(th)))) + r.int(3, 15)
  const Rn = m * G - P * Math.sin(rad(th)), val = (P * Math.cos(rad(th)) - mu * Rn) / m
  return q.num(L`A box of mass $${m}$ kg is pulled along a rough horizontal floor by a force of $${P}$ N acting at $${th}^\circ$ above the horizontal. The coefficient of friction is $${mu}$. Find the acceleration of the box.` + GNOTE, val,
    L`Vertically: $R + ${P}\sin ${th}^\circ = ${m}g \Rightarrow R = ${fmtSf(Rn, 4)}$ N. Friction $= ${mu}R = ${fmtSf(mu * Rn, 4)}$ N. Horizontally: $${P}\cos ${th}^\circ - ${fmtSf(mu * Rn, 4)} = ${m}a \Rightarrow a = ${fmtSf(val)}$ m s$^{-2}$.`,
    { sf: 2, unit: 'ms^-2', v: `(${P}*cos(rad(${th})) - ${dec(mu)}*(${m}*Rational(98,10) - ${P}*sin(rad(${th}))))/${m}`, err: 'The upward component of the pull REDUCES the normal reaction, so $R \\ne mg$.' })
})

g('proj', 'm2.6', 'M7.5', 3, 'Projectiles from ground level', (r, q) => {
  const u = r.int(10, 40), th = r.pick([20, 30, 35, 40, 50, 60]), kind = r.int(0, 2), s = Math.sin(rad(th)), c = Math.cos(rad(th))
  const stem = L`A particle is projected from a point on horizontal ground with speed $${u}$ m s$^{-1}$ at $${th}^\circ$ above the horizontal. `
  const dia = { k: 'projectile' as const, angle: th, labelU: `${u}` }
  if (kind === 0) return q.num(stem + 'Find the time of flight.' + GNOTE, (2 * u * s) / G, L`Vertically, $s = 0$: $0 = ${u}\sin ${th}^\circ\, t - 4.9t^2 \Rightarrow t = \dfrac{2(${u})\sin ${th}^\circ}{9.8} = ${fmtSf((2 * u * s) / G)}$ s.`, { sf: 2, unit: 's', v: `max(solve(${u}*sin(rad(${th}))*t - Rational(49,10)*t**2, t))`, dia })
  if (kind === 1) return q.num(stem + 'Find the greatest height reached.' + GNOTE, (u * s) ** 2 / (2 * G), L`Vertically, $v = 0$ at the top: $0 = (${u}\sin ${th}^\circ)^2 - 2(9.8)h \Rightarrow h = ${fmtSf((u * s) ** 2 / (2 * G))}$ m.`, { sf: 2, unit: 'm', v: `(${u}*sin(rad(${th})))**2/(2*Rational(98,10))`, dia })
  return q.num(stem + 'Find the horizontal range.' + GNOTE, (2 * u * s * u * c) / G, L`Time of flight $t = \dfrac{2(${u})\sin ${th}^\circ}{9.8} = ${fmtSf((2 * u * s) / G, 4)}$ s. Horizontal speed is constant: range $= ${u}\cos ${th}^\circ \times t = ${fmtSf((2 * u * s * u * c) / G)}$ m.`,
    { sf: 2, unit: 'm', v: `${u}*cos(rad(${th}))*max(solve(${u}*sin(rad(${th}))*t - Rational(49,10)*t**2, t))`, dia, err: 'Projectile formulae are not in the booklet. Derive them: horizontal has no acceleration; vertical has $a = -g$.' })
})

g('projcliff', 'm2.6', 'M7.5', 3, 'Projectile from a height', (r, q) => {
  const u = r.int(5, 25), h = r.pick([10, 20, 30, 45, 60, 80]), t = Math.sqrt((2 * h) / G), askR = r.next() < 0.6
  return q.num(L`A ball is projected horizontally at $${u}$ m s$^{-1}$ from the top of a cliff $${h}$ m above the sea. Find ${askR ? 'the horizontal distance it travels before hitting the sea' : 'the time it takes to hit the sea'}.` + GNOTE, askR ? u * t : t,
    L`Vertically: $u_y = 0$, so $${h} = \tfrac12(9.8)t^2 \Rightarrow t = ${fmtSf(t, 4)}$ s.` + (askR ? L` Horizontally: $x = ${u} \times ${fmtSf(t, 4)} = ${fmtSf(u * t)}$ m.` : ''),
    { sf: 2, unit: askR ? 'm' : 's', v: askR ? `${u}*sqrt(2*${h}/Rational(98,10))` : `sqrt(2*${h}/Rational(98,10))`, dia: { k: 'projectile', angle: 0, h, labelU: `${u}` }, err: 'Projected horizontally means the initial VERTICAL velocity is zero.' })
})

g('equil', 'm2.7', 'M8.5', 3, 'Equilibrium on a smooth incline', (r, q) => {
  const m = r.int(2, 10), al = r.pick([20, 25, 30, 35, 40]), horiz = r.next() < 0.5, val = horiz ? m * G * Math.tan(rad(al)) : m * G * Math.sin(rad(al))
  return q.num(L`A particle of mass $${m}$ kg is held at rest on a smooth plane inclined at $${al}^\circ$ to the horizontal by a ${horiz ? 'horizontal force' : 'force acting up the line of greatest slope'} of $P$ N. Find $P$.` + GNOTE, val,
    horiz ? L`Resolve along the plane: $P\cos ${al}^\circ = ${m}g\sin ${al}^\circ \Rightarrow P = ${m}g\tan ${al}^\circ = ${fmtSf(val)}$ N.` : L`Resolve along the plane: $P = ${m}g\sin ${al}^\circ = ${fmtSf(val)}$ N.`,
    { sf: 2, unit: 'N', v: horiz ? `${m}*Rational(98,10)*tan(rad(${al}))` : `${m}*Rational(98,10)*sin(rad(${al}))`, dia: { k: 'incline', angle: al, forces: [{ dir: 'normal', label: 'R' }, { dir: 'weight', label: `${m}g` }, { dir: horiz ? 'horiz' : 'up', label: 'P' }] }, err: 'A horizontal force has a component along the plane AND one into the plane.' })
})

g('tablepulley', 'm2.7', 'M8.4,M8.6', 4, 'Rough table and pulley', (r, q) => {
  const m1 = r.int(2, 6), m2 = r.int(2, 6), mu = r.pick([0.1, 0.2, 0.25, 0.3].filter((x) => x * m1 < m2)), a = ((m2 - mu * m1) * G) / (m1 + m2)
  return q.num(L`Particle $A$ of mass $${m1}$ kg rests on a rough horizontal table (coefficient of friction $${mu}$). It is connected by a light inextensible string over a smooth pulley at the edge of the table to particle $B$ of mass $${m2}$ kg, which hangs freely. The system is released from rest. Find the acceleration.` + GNOTE, a,
    L`$A$: $R = ${m1}g$, friction $= ${mu} \times ${m1}g$. $T - ${fmt(mu * m1)}g = ${m1}a$. $B$: $${m2}g - T = ${m2}a$. Add: $(${m2} - ${fmt(mu * m1)})g = ${m1 + m2}a \Rightarrow a = ${fmtSf(a)}$ m s$^{-2}$.`,
    { sf: 2, unit: 'ms^-2', v: `(${m2}-${dec(mu)}*${m1})*Rational(98,10)/(${m1}+${m2})`, dia: { k: 'pulley', m1: `A ${m1} kg`, m2: `B ${m2} kg`, table: true }, err: 'Friction acts on $A$ only, and opposes its motion towards the pulley.' })
})

g('inclpulley', 'm2.7', 'M8.4,M8.5', 4, 'Incline and pulley', (r, q) => {
  const al = r.pick([25, 30, 35]), m1 = r.int(2, 5), m2 = m1 + r.int(0, 4), a = ((m2 - m1 * Math.sin(rad(al))) * G) / (m1 + m2)
  return q.num(L`Particle $A$ of mass $${m1}$ kg lies on a smooth plane inclined at $${al}^\circ$ to the horizontal. It is connected by a light inextensible string over a smooth pulley at the top of the plane to particle $B$ of mass $${m2}$ kg, which hangs freely. The system is released from rest. Find the acceleration of $B$.` + GNOTE, a,
    L`$B$ (down): $${m2}g - T = ${m2}a$. $A$ (up the plane): $T - ${m1}g\sin ${al}^\circ = ${m1}a$. Add: $a = \dfrac{(${m2} - ${m1}\sin ${al}^\circ)g}{${m1 + m2}} = ${fmtSf(a)}$ m s$^{-2}$.`,
    { sf: 2, unit: 'ms^-2', v: `(${m2}-${m1}*sin(rad(${al})))*Rational(98,10)/(${m1}+${m2})`, dia: { k: 'pulley', m1: `A ${m1} kg`, m2: `B ${m2} kg`, incline: al }, err: 'Only the component $mg\\sin\\alpha$ of the weight of $A$ acts along the plane.' })
})

g('kinvec', 'm2.8', 'M7.3', 3, 'Constant acceleration with vectors', (r, q) => {
  const u = [r.int(-5, 6), r.int(-5, 6)], a = [r.nz(-3, 3), r.nz(-3, 3)], t = r.int(2, 6), v = [u[0] + a[0] * t, u[1] + a[1] * t], val = Math.hypot(v[0], v[1])
  return q.num(L`A particle has initial velocity $(${u[0]}\mathbf{i} ${sg(u[1], '\\mathbf{j}')})$ m s$^{-1}$ and constant acceleration $(${a[0]}\mathbf{i} ${sg(a[1], '\\mathbf{j}')})$ m s$^{-2}$. Find its speed after $${t}$ seconds, to 3 significant figures.`, val,
    L`$\mathbf{v} = \mathbf{u} + \mathbf{a}t = (${v[0]}\mathbf{i} ${sg(v[1], '\\mathbf{j}')})$ m s$^{-1}$. Speed $= |\mathbf{v}| = \sqrt{${v[0] * v[0]} + ${v[1] * v[1]}} = ${fmtSf(val)}$ m s$^{-1}$.`,
    { unit: 'ms^-1', v: `sqrt((${u[0]}+(${a[0]})*${t})**2+(${u[1]}+(${a[1]})*${t})**2)`, err: 'Speed is the magnitude of the velocity vector, a single positive number.' })
})

g('calcvec', 'm2.8', 'M7.4', 3, 'Vector calculus in kinematics', (r, q) => {
  const a = r.nz(-3, 4), b = r.nz(-2, 3), k = r.int(1, 3), val = Math.hypot(2 * a * k, 3 * b * k * k)
  return q.num(L`At time $t$ seconds a particle has position vector $\mathbf{r} = (${a === 1 ? '' : a === -1 ? '-' : a}t^2\mathbf{i} ${sg(b, 't^3\\mathbf{j}')})$ m. Find its speed when $t = ${k}$, to 3 significant figures.`, val,
    L`$\mathbf{v} = \dfrac{d\mathbf{r}}{dt} = ${2 * a}t\,\mathbf{i} ${sg(3 * b, 't^2\\mathbf{j}')}$. At $t = ${k}$: $\mathbf{v} = ${2 * a * k}\mathbf{i} ${sg(3 * b * k * k, '\\mathbf{j}')}$, speed $= ${fmtSf(val)}$ m s$^{-1}$.`,
    { unit: 'ms^-1', v: `sqrt(diff((${a})*t**2, t).subs(t, ${k})**2 + diff((${b})*t**3, t).subs(t, ${k})**2)`, err: 'Differentiate each component separately, then find the magnitude.' })
})
