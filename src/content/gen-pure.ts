/** Parameterised generators: Pure. Every `v.s` restates the displayed problem for SymPy to solve independently. */
import { gcd } from '../lib/rng'
import { co, fmt, fmtSf, fr, polyPy, polyTex, sg } from './build'
import { L, makeRegistry } from './gen-core'

const { list, g } = makeRegistry()
export const PURE_GENERATORS = list

/** signed sum of terms: each term is [coefficient, body(|coefficient|)] */
const S = (ts: [number, (a: number) => string][]) =>
  ts.filter(([c]) => c !== 0).map(([c, f], i) => (i === 0 ? (c < 0 ? '-' : '') : c < 0 ? ' - ' : ' + ') + f(Math.abs(c))).join('') || '0'
const pw = (v: string, p: number) => (p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`)
const cx = (a: number, body: string) => (a === 1 && body ? body : `${fmt(a)}${body}`)
/** positive fraction n/d times body */
const cf = (n: number, d: number, body: string) => { const k = gcd(n, d); n /= k; d /= k; return d === 1 ? cx(n, body) : `\\frac{${n}}{${d}}${body}` }
const P = (n: number) => (n < 0 ? `(${n})` : `${n}`)

// ---------- Year 1 ----------
g('indices', 'p1.1', 'P2.1', 2, 'Fractional and negative indices', (r, q) => {
  const [b, n] = r.pick([[8, 3], [27, 3], [16, 4], [81, 4], [32, 5], [4, 2], [9, 2], [25, 2], [64, 3], [125, 3], [16, 2], [49, 2]])
  const m = r.int(2, 3), neg = r.next() < 0.5
  const root = Math.round(Math.pow(b, 1 / n)), val = Math.pow(root, m)
  return q.num(L`Evaluate $${b}^{${neg ? '-' : ''}\frac{${m}}{${n}}}$. Give an exact answer.`, neg ? 1 / val : val,
    L`$${b}^{\frac{1}{${n}}} = ${root}$, so $${b}^{\frac{${m}}{${n}}} = ${root}^{${m}} = ${val}$.` + (neg ? L` The negative index means reciprocal: $\frac{1}{${val}}$.` : ''),
    { exact: true, v: `Integer(${b})**Rational(${neg ? -m : m},${n})`, err: 'Root first, then power. A negative index gives the reciprocal, not a negative number.', memo: 'memorise' })
})

g('surd', 'p1.1', 'P2.2', 3, 'Rationalising a denominator', (r, q) => {
  const b = r.pick([2, 3, 5, 7]), a = r.pick([2, 3, 4, 5].filter((x) => x * x !== b)), D = a * a - b
  const k = r.int(1, 3) * Math.abs(D), p = (k * a) / D, qq = -k / D
  const askQ = r.next() < 0.6
  return q.num(L`$\dfrac{${k}}{${a} + \sqrt{${b}}} = p + q\sqrt{${b}}$, where $p$ and $q$ are rational. Find $${askQ ? 'q' : 'p'}$.`, askQ ? qq : p,
    L`Multiply top and bottom by $${a} - \sqrt{${b}}$: $\dfrac{${k}(${a} - \sqrt{${b}})}{${a * a} - ${b}} = \dfrac{${k}(${a} - \sqrt{${b}})}{${D}} = ${fmt(p)} ${sg(qq, `\\sqrt{${b}}`)}$.`,
    { exact: true, v: askQ ? `radsimp(Integer(${k})/(${a}+sqrt(${b}))).coeff(sqrt(${b}))` : `radsimp(Integer(${k})/(${a}+sqrt(${b}))).as_coeff_Add()[0]`,
      err: 'Multiply by the conjugate (change the sign of the surd), and keep track of the sign of q.' })
})

g('disc', 'p1.2', 'P2.3', 2, 'Discriminant', (r, q) => {
  const a = r.nz(-4, 5), b = r.int(-9, 9), c = r.nz(-6, 6), d = b * b - 4 * a * c
  return q.num(L`Find the discriminant of $${polyTex([a, b, c])}$.`, d,
    L`$b^2 - 4ac = (${b})^2 - 4(${a})(${c}) = ${b * b} ${sg(-4 * a * c)} = ${d}$. ` + (d > 0 ? 'Positive: two distinct real roots.' : d === 0 ? 'Zero: one repeated root.' : 'Negative: no real roots.'),
    { exact: true, v: `discriminant(${polyPy([a, b, c])}, x)`, err: 'Sign slips in $-4ac$ when $a$ or $c$ is negative. Bracket the negatives.', memo: 'memorise' })
})

g('complete', 'p1.2', 'P2.3', 2, 'Completing the square', (r, q) => {
  const b = 2 * r.nz(-5, 5), c = r.int(-9, 12), h = b / 2, k = c - h * h
  return q.num(L`$${polyTex([1, b, c])} \equiv (x + p)^2 + q$. Find the value of $q$.`, k,
    L`$p = \frac{${b}}{2} = ${h}$, so $(x ${sg(h)})^2 = x^2 ${sg(b, 'x')} + ${h * h}$. Then $q = ${c} - ${h * h} = ${k}$.`,
    { exact: true, v: `${c} - Rational(${b},2)**2`, err: 'Subtract $p^2$; do not add it.' })
})

g('roots', 'p1.2', 'P2.3', 2, 'Solving a quadratic', (r, q) => {
  const r1 = r.int(-7, 3), r2 = r.int(r1 + 1, 8), a = r.pick([1, 1, 2, 3])
  const cs = [a, -a * (r1 + r2), a * r1 * r2]
  return q.num(L`Solve $${polyTex(cs)} = 0$. Give the larger root.`, r2,
    L`${a > 1 ? L`Divide by ${a}: $${polyTex([1, -(r1 + r2), r1 * r2])} = 0$. ` : ''}Factorise: $(x ${sg(-r1)})(x ${sg(-r2)}) = 0$, so $x = ${r1}$ or $x = ${r2}$.`,
    { exact: true, v: `max(solve(${polyPy(cs)}, x))` })
})

g('quadineq', 'p1.3', 'P2.5', 3, 'Quadratic inequality', (r, q) => {
  const r1 = r.int(-6, 2), r2 = r.int(r1 + 1, 7), lt = r.next() < 0.5
  const cs = [1, -(r1 + r2), r1 * r2]
  const inside = L`$${r1} < x < ${r2}$`, outside = L`$x < ${r1}$ or $x > ${r2}$`
  const set = lt ? `Interval.open(${r1},${r2})` : `Union(Interval.open(-oo,${r1}), Interval.open(${r2},oo))`
  return q.mcq(L`Solve $${polyTex(cs)} ${lt ? '<' : '>'} 0$.`,
    [lt ? inside : outside, lt ? outside : inside, L`$x < ${r2}$`, L`$${-r2} < x < ${-r1}$`],
    L`Critical values: $(x ${sg(-r1)})(x ${sg(-r2)}) = 0 \Rightarrow x = ${r1}, ${r2}$. The parabola is U-shaped, so it is below the axis between the roots and above it outside them. Answer: ${lt ? inside : outside}.`,
    { v: { s: `Integer(solveset(${polyPy(cs)} ${lt ? '<' : '>'} 0, x, S.Reals) == ${set})`, val: 1 }, err: 'Sketch the parabola. Do not just copy the inequality sign onto each root.' })
})

g('subst', 'p1.2', 'P2.3', 2, 'Substituting a negative value', (r, q) => {
  const cubic = r.next() < 0.5
  const cs = cubic ? [r.nz(-3, 3), r.nz(-5, 5), r.nz(-7, 7), r.nz(-9, 9)] : [r.nz(-4, 4), r.nz(-8, 8), r.nz(-9, 9)]
  const k = -r.int(1, 4), n = cs.length - 1
  const terms = cs.map((c, i) => c * Math.pow(k, n - i)), val = terms.reduce((s, x) => s + x, 0)
  return q.num(L`$f(x) = ${polyTex(cs)}$. Find $f(${k})$.`, val,
    L`Substitute with brackets, one term at a time: $${cs.map((c, i) => (n - i === 0 ? `(${c})` : `${c}(${k})${n - i > 1 ? `^{${n - i}}` : ''}`)).join(' + ')}$ $= ${terms.map((x) => `(${x})`).join(' + ')} = ${val}$. Count the terms: ${cs.length} in, ${cs.length} out. The last one is the constant ${cs[n]}.`,
    { exact: true, v: `${polyPy(cs)}.subs(x, ${k})`, err: 'This is your tracked slip: the constant term gets dropped. Count the terms before and after substituting.' })
}, { weak: 'const' })

g('line', 'p1.5', 'P3.1', 2, 'Line through two points', (r, q) => {
  const x1 = r.int(-5, 3), x2 = x1 + r.nz(-4, 5), y1 = r.int(-6, 6), y2 = y1 + r.nz(-8, 8)
  const askC = r.next() < 0.5, dx = x2 - x1, dy = y2 - y1
  return q.num(L`A line passes through $(${x1}, ${y1})$ and $(${x2}, ${y2})$. Find ${askC ? 'its $y$-intercept' : 'its gradient'}. Give an exact answer.`,
    askC ? y1 - (dy / dx) * x1 : dy / dx,
    L`$m = \dfrac{${y2} - ${P(y1)}}{${x2} - ${P(x1)}} = ${fr(dy, dx)}$.` + (askC ? L` Then $c = y_1 - mx_1 = ${y1} - \left(${fr(dy, dx)}\right)(${x1}) = ${fr(y1 * dx - dy * x1, dx)}$.` : ''),
    { exact: true, v: askC ? `${y1} - Rational(${dy},${dx})*(${x1})` : `Rational(${y2}-(${y1}), ${x2}-(${x1}))`, err: 'Keep the same order top and bottom: $(y_2 - y_1)/(x_2 - x_1)$.' })
})

g('perp', 'p1.5', 'P3.1', 2, 'Perpendicular gradient', (r, q) => {
  const a = r.nz(-5, 5), b = r.nz(-5, 5), c = r.int(-9, 9)
  return q.num(L`Find the gradient of a line perpendicular to $${a === 1 ? '' : a === -1 ? '-' : a}x ${sg(b, 'y')} = ${c}$. Give an exact answer.`, b / a,
    L`Rearrange: $y = ${fr(-a, b)}x ${sg(c / b)}$, so the gradient is $${fr(-a, b)}$. Perpendicular gradient $= -1 \div \left(${fr(-a, b)}\right) = ${fr(b, a)}$.`,
    { exact: true, v: `-1/solve(${a}*x+(${b})*y-(${c}), y)[0].coeff(x)`, err: 'Negative reciprocal: flip the fraction and change the sign.', memo: 'memorise' })
})

g('circle', 'p1.6', 'P3.2', 3, 'Circle: centre and radius', (r, q) => {
  const p = r.nz(-6, 6), qq = r.nz(-6, 6), rad = r.int(2, 9)
  const A = -2 * p, B = -2 * qq, C = p * p + qq * qq - rad * rad, askR = r.next() < 0.6
  const eq = L`x^2 + y^2 ${sg(A, 'x')} ${sg(B, 'y')} ${C === 0 ? '' : sg(C)} = 0`
  return q.num(L`A circle has equation $${eq}$. Find ${askR ? 'its radius' : 'the $x$-coordinate of its centre'}.`, askR ? rad : p,
    L`Complete the square: $(x ${sg(-p)})^2 + (y ${sg(-qq)})^2 = ${p * p} + ${qq * qq} ${sg(-C)} = ${rad * rad}$. Centre $(${p}, ${qq})$, radius $${rad}$.`,
    { exact: true, v: askR ? `sqrt(Rational(${A},2)**2 + Rational(${B},2)**2 - (${C}))` : `-Rational(${A},2)`, err: 'The centre has the opposite signs to the brackets, and $r^2$ gains both squared terms.' })
})

g('factor', 'p1.7', 'P2.6', 3, 'Factor theorem: find the constant', (r, q) => {
  const k = r.nz(-3, 3), a = r.int(-5, 5), b = r.int(-8, 8), c = -(k * k * k + a * k * k + b * k)
  return q.num(L`$f(x) = x^3 ${a ? sg(a, 'x^2') : ''} ${b ? sg(b, 'x') : ''} + c$. Given that $(x ${sg(-k)})$ is a factor of $f(x)$, find $c$.`, c,
    L`Factor theorem: $f(${k}) = 0$. So $(${k})^3 ${sg(a)}(${k})^2 ${sg(b)}(${k}) + c = 0 \Rightarrow ${k * k * k} ${sg(a * k * k)} ${sg(b * k)} + c = 0 \Rightarrow c = ${c}$.`,
    { exact: true, v: `solve((${k})**3 + (${a})*(${k})**2 + (${b})*(${k}) + c, c)[0]`, err: 'Use $f(k)$ for the factor $(x - k)$: watch the sign of $k$, and keep the $+c$ in the equation.' })
}, { weak: 'const' })

g('binom', 'p1.8', 'P4.1', 3, 'Binomial coefficient', (r, q) => {
  const n = r.int(4, 7), a = r.pick([1, 2, 3]), b = r.nz(-3, 3), k = r.int(1, 3)
  let c = 1; for (let i = 0; i < k; i++) c = (c * (n - i)) / (i + 1)
  const val = c * Math.pow(a, n - k) * Math.pow(b, k)
  return q.num(L`Find the coefficient of $x^{${k}}$ in the expansion of $(${a} ${sg(b, 'x')})^{${n}}$.`, val,
    L`Term: $\binom{${n}}{${k}}(${a})^{${n - k}}(${b}x)^{${k}} = ${c} \times ${Math.pow(a, n - k)} \times ${P(Math.pow(b, k))}\,x^{${k}} = ${val}x^{${k}}$.`,
    { exact: true, v: `expand((${a}+(${b})*x)**${n}).coeff(x, ${k})`, err: L`Raise the whole of $(${b}x)$ to the power, including the sign and the number.`, memo: 'booklet' })
})

g('sinerule', 'p1.9', 'P5.1', 2, 'Sine rule', (r, q) => {
  const A = r.int(35, 80), B = r.int(25, 70), a = r.int(4, 15), val = (a * Math.sin((B * Math.PI) / 180)) / Math.sin((A * Math.PI) / 180)
  return q.num(L`In triangle $ABC$, angle $A = ${A}^\circ$, angle $B = ${B}^\circ$ and $BC = ${a}$ cm. Find $AC$ to 3 significant figures.`, val,
    L`$\dfrac{AC}{\sin ${B}^\circ} = \dfrac{${a}}{\sin ${A}^\circ} \Rightarrow AC = \dfrac{${a}\sin ${B}^\circ}{\sin ${A}^\circ} = ${fmtSf(val)}$ cm.`,
    { unit: 'cm', v: `${a}*sin(rad(${B}))/sin(rad(${A}))`, dia: { k: 'triangle', A: `${A}°`, B: `${B}°`, a: `${a} cm`, b: '?' }, err: 'Each side pairs with the angle opposite it. Calculator in degrees.', memo: 'memorise' })
})

g('cosrule', 'p1.9', 'P5.1', 2, 'Cosine rule', (r, q) => {
  const b = r.int(4, 12), c = r.int(4, 12), A = r.int(30, 130), val = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos((A * Math.PI) / 180))
  return q.num(L`In triangle $ABC$, $AC = ${b}$ cm, $AB = ${c}$ cm and angle $A = ${A}^\circ$. Find $BC$ to 3 significant figures.`, val,
    L`$BC^2 = ${b}^2 + ${c}^2 - 2(${b})(${c})\cos ${A}^\circ = ${fmtSf(val * val, 4)}$, so $BC = ${fmtSf(val)}$ cm.`,
    { unit: 'cm', v: `sqrt(${b}**2+${c}**2-2*${b}*${c}*cos(rad(${A})))`, dia: { k: 'triangle', A: `${A}°`, b: `${b} cm`, c: `${c} cm`, a: '?' }, err: 'Square root at the end. For obtuse angles $\\cos A$ is negative, so the last term is added.', memo: 'memorise' })
})

g('triarea', 'p1.9', 'P5.1', 2, 'Area of a triangle', (r, q) => {
  const a = r.int(4, 14), b = r.int(4, 14), C = r.int(25, 150), val = 0.5 * a * b * Math.sin((C * Math.PI) / 180)
  return q.num(L`Two sides of a triangle are $${a}$ cm and $${b}$ cm, and the angle between them is $${C}^\circ$. Find the area to 3 significant figures.`, val,
    L`Area $= \tfrac12 ab\sin C = \tfrac12(${a})(${b})\sin ${C}^\circ = ${fmtSf(val)}$ cm$^2$.`,
    { unit: 'cm^2', v: `Rational(1,2)*${a}*${b}*sin(rad(${C}))`, memo: 'memorise' })
})

g('trigsolve', 'p1.10', 'P5.7', 3, 'Solving a trig equation (degrees)', (r, q) => {
  const f = r.pick(['sin', 'cos', 'tan'] as const), k = (r.next() < 0.5 ? -1 : 1) * r.int(2, 9) / 10
  const d = (x: number) => (x * 180) / Math.PI
  let sols: number[]
  if (f === 'sin') { const b = d(Math.asin(k)); sols = k > 0 ? [b, 180 - b] : [180 - b, 360 + b] }
  else if (f === 'cos') { const b = d(Math.acos(k)); sols = [b, 360 - b] }
  else { const b = d(Math.atan(k)); sols = k > 0 ? [b, b + 180] : [b + 180, b + 360] }
  return q.num(L`Solve $${'\\' + (f)} x = ${k}$ for $0 \le x < 360^\circ$. Give the larger solution to 1 decimal place.`, sols[1],
    L`Calculator: $${'\\' + (f)}^{-1}(${k}) = ${d(f === 'sin' ? Math.asin(k) : f === 'cos' ? Math.acos(k) : Math.atan(k)).toFixed(1)}^\circ$. Use the ${f === 'tan' ? 'period of $180^\\circ$' : f === 'sin' ? 'symmetry $\\sin x = \\sin(180^\\circ - x)$' : 'symmetry $\\cos x = \\cos(360^\\circ - x)$'} to list all solutions in range: $x = ${sols[0].toFixed(1)}^\circ, ${sols[1].toFixed(1)}^\circ$.`,
    { tol: 0.05, unit: '°', v: `max(roots('${f}(rad(x))-(${k})', 0, 360))`, err: 'The calculator gives one value only. Sketch the graph or use CAST to find the second, and check both are in range.' })
})

g('vecmag', 'p1.11', 'P10.2', 1, 'Magnitude of a vector', (r, q) => {
  const a = r.nz(-9, 9), b = r.nz(-9, 9), val = Math.hypot(a, b)
  return q.num(L`Find the magnitude of $${a}\mathbf{i} ${sg(b, '\\mathbf{j}')}$. Give your answer to 3 significant figures.`, val,
    L`$\sqrt{(${a})^2 + (${b})^2} = \sqrt{${a * a + b * b}} = ${fmtSf(val)}$.`, { v: `sqrt((${a})**2+(${b})**2)`, memo: 'memorise' })
})

g('vecunits', 'p1.11', 'P10.5', 3, 'Vectors with mixed units', (r, q) => {
  const a = r.nz(-9, 9), b = r.nz(-9, 9), sp = Math.hypot(a, b), kind = r.int(0, 2)
  if (kind === 0) {
    const T = r.pick([10, 15, 20, 24, 36, 45]), val = (sp * T) / 60
    return q.num(L`A ship moves with constant velocity $(${a}\mathbf{i} ${sg(b, '\\mathbf{j}')})$ km h$^{-1}$. Find the distance it travels in $${T}$ minutes, in km, to 3 significant figures.`, val,
      L`Speed $= \sqrt{${a * a} + ${b * b}} = ${fmtSf(sp)}$ km h$^{-1}$. Units: the speed is per **hour**, the time is in **minutes**. $${T}$ min $= \frac{${T}}{60}$ h. Distance $= ${fmtSf(sp)} \times \frac{${T}}{60} = ${fmtSf(val)}$ km.`,
      { unit: 'km', v: `sqrt((${a})**2+(${b})**2)*Rational(${T},60)`, err: 'Your tracked slip: mixing hours and minutes. Convert before multiplying, and write the units on every line.' })
  }
  if (kind === 1) {
    const T = r.int(2, 9), val = sp * T * 60
    return q.num(L`A particle moves with constant velocity $(${a}\mathbf{i} ${sg(b, '\\mathbf{j}')})$ m s$^{-1}$. Find the distance it travels in $${T}$ minutes, in metres, to 3 significant figures.`, val,
      L`Speed $= \sqrt{${a * a + b * b}} = ${fmtSf(sp)}$ m s$^{-1}$. $${T}$ minutes $= ${T * 60}$ s. Distance $= ${fmtSf(sp)} \times ${T * 60} = ${fmtSf(val)}$ m.`,
      { unit: 'm', v: `sqrt((${a})**2+(${b})**2)*${T}*60`, err: 'Your tracked slip: metres per second with minutes. Convert the time to seconds first.' })
  }
  const v = r.pick([4, 5, 8, 10, 12, 20]), val = (sp * 1000) / v
  return q.num(L`Relative to a fixed origin, $A$ has position vector $\mathbf{0}$ and $B$ has position vector $(${a}\mathbf{i} ${sg(b, '\\mathbf{j}')})$ km. A drone flies from $A$ to $B$ at a constant $${v}$ m s$^{-1}$. Find the time taken in seconds, to 3 significant figures.`, val,
    L`$AB = \sqrt{${a * a + b * b}} = ${fmtSf(sp)}$ km $= ${fmtSf(sp * 1000)}$ m. Time $= \dfrac{${fmtSf(sp * 1000)}}{${v}} = ${fmtSf(val)}$ s.`,
    { unit: 's', v: `sqrt((${a})**2+(${b})**2)*1000/${v}`, err: 'Your tracked slip: km with m s$^{-1}$. Convert the distance to metres before dividing.' })
}, { weak: 'vecunits' })

g('diffpoly', 'p1.12', 'P7.2', 2, 'Differentiating powers of x', (r, q) => {
  const a = r.nz(-5, 6), n = r.int(2, 5), b = r.nz(-6, 6), c = r.nz(-5, 5), p = r.int(1, 3)
  const f = S([[a, (k) => cx(k, pw('x', n))], [b, (k) => cx(k, '\\sqrt{x}')], [c, (k) => `\\frac{${k}}{${pw('x', p)}}`]])
  const d = S([[a * n, (k) => cx(k, pw('x', n - 1))], [b, (k) => `\\frac{${k}}{2\\sqrt{x}}`], [-c * p, (k) => `\\frac{${k}}{${pw('x', p + 1)}}`]])
  return q.expr(L`Differentiate $y = ${f}$ with respect to $x$.`, d,
    L`Write as powers: $y = ${S([[a, (k) => cx(k, pw('x', n))], [b, (k) => cx(k, 'x^{\\frac12}')], [c, (k) => cx(k, `x^{-${p}}`)]])}$. Multiply by the power, reduce the power by one: $\dfrac{dy}{dx} = ${d}$.`,
    { v: `diff((${a})*x**${n} + (${b})*sqrt(x) + (${c})/x**${p}, x)`, err: L`$\frac{1}{x^n} = x^{-n}$ differentiates to $-nx^{-n-1}$: the power goes down (more negative), not up.`, memo: 'memorise' })
})

g('diffgrad', 'p1.12', 'P7.2', 2, 'Gradient at a point', (r, q) => {
  const cs = [r.nz(-3, 3), r.int(-5, 5), r.int(-8, 8), r.int(-9, 9)], k = r.nz(-3, 3)
  const val = 3 * cs[0] * k * k + 2 * cs[1] * k + cs[2]
  return q.num(L`Find the gradient of the curve $y = ${polyTex(cs)}$ at the point where $x = ${k}$.`, val,
    L`$\dfrac{dy}{dx} = ${polyTex([3 * cs[0], 2 * cs[1], cs[2]])}$. At $x = ${k}$: $${3 * cs[0]}(${k})^2 ${sg(2 * cs[1])}(${k}) ${sg(cs[2])} = ${val}$.`,
    { exact: true, v: `diff(${polyPy(cs)}, x).subs(x, ${k})`, err: 'Differentiate first, then substitute. The constant in $y$ disappears, but the constant in $dy/dx$ does not.' })
})

g('tangent', 'p1.12', 'P7.3', 3, 'Equation of a tangent', (r, q) => {
  const a = r.nz(-3, 3), b = r.int(-6, 6), c = r.int(-8, 8), k = r.nz(-3, 3)
  const m = 2 * a * k + b, y0 = a * k * k + b * k + c, cc = y0 - m * k
  return q.num(L`The tangent to $y = ${polyTex([a, b, c])}$ at $x = ${k}$ has equation $y = mx + c$. Find $c$.`, cc,
    L`$\dfrac{dy}{dx} = ${polyTex([2 * a, b])}$, so $m = ${m}$. At $x = ${k}$, $y = ${a}(${k})^2 ${sg(b)}(${k}) ${sg(c)} = ${y0}$. Tangent: $y - ${P(y0)} = ${m}(x - ${P(k)})$, so $c = ${y0} - (${m})(${k}) = ${cc}$.`,
    { exact: true, v: `(${polyPy([a, b, c])}.subs(x,${k}) - diff(${polyPy([a, b, c])},x).subs(x,${k})*(${k}))`, err: 'Find the $y$-coordinate from the original curve (all three terms), not from the derivative.' })
})

g('stationary', 'p1.12', 'P7.3', 3, 'Stationary points', (r, q) => {
  const p = r.int(-4, 2), qq = p + 2 * r.int(1, 3), c = r.int(-6, 6)
  const cs = [1, (-3 * (p + qq)) / 2, 3 * p * qq, c]
  return q.num(L`The curve $y = ${polyTex(cs)}$ has two stationary points. Find the $x$-coordinate of the local minimum.`, qq,
    L`$\dfrac{dy}{dx} = ${polyTex([3, cs[1] * 2, cs[2]])} = 3(x ${sg(-p)})(x ${sg(-qq)}) = 0 \Rightarrow x = ${p}$ or $${qq}$. $\dfrac{d^2y}{dx^2} = ${polyTex([6, cs[1] * 2])}$: at $x = ${qq}$ this is $${6 * qq + cs[1] * 2} > 0$, so a minimum.`,
    { exact: true, v: `[s for s in solve(diff(${polyPy(cs)}, x), x) if diff(${polyPy(cs)}, x, 2).subs(x, s) > 0][0]`, err: 'Positive second derivative means minimum.' })
})

g('intpoly', 'p1.13', 'P8.2', 2, 'Integrating powers of x', (r, q) => {
  const n = r.int(2, 4), a = r.nz(-4, 4) * (n + 1), b = r.nz(-6, 6), c = r.nz(-5, 5)
  const f = S([[a, (k) => cx(k, pw('x', n))], [b, (k) => `\\frac{${k}}{x^2}`], [c, (k) => `${k}`]])
  const F = S([[a / (n + 1), (k) => cx(k, pw('x', n + 1))], [-b, (k) => `\\frac{${k}}{x}`], [c, (k) => cx(k, 'x')]])
  return q.expr(L`Find $\displaystyle\int \left(${f}\right)dx$.`, F,
    L`Write $\frac{${Math.abs(b)}}{x^2}$ as $${Math.abs(b)}x^{-2}$. Add one to each power and divide by the new power: $${F} + C$.`,
    { addC: true, v: `integrate((${a})*x**${n} + (${b})/x**2 + (${c}), x)`, err: L`$\int x^{-2}\,dx = -x^{-1}$. Do not forget $+C$.`, memo: 'memorise' })
})

g('intdef', 'p1.13', 'P8.3', 3, 'Definite integral', (r, q) => {
  const cs = [3 * r.nz(-2, 2), 2 * r.int(-3, 3), r.int(-5, 6)], lo = r.int(-2, 1), hi = lo + r.int(1, 3)
  const F = (x: number) => (cs[0] / 3) * x ** 3 + (cs[1] / 2) * x * x + cs[2] * x
  return q.num(L`Evaluate $\displaystyle\int_{${lo}}^{${hi}} \left(${polyTex(cs)}\right)dx$.`, F(hi) - F(lo),
    L`$\left[${polyTex([cs[0] / 3, cs[1] / 2, cs[2], 0])}\right]_{${lo}}^{${hi}} = (${F(hi)}) - (${F(lo)}) = ${F(hi) - F(lo)}$.`,
    { exact: true, v: `integrate(${polyPy(cs)}, (x, ${lo}, ${hi}))`, err: 'Upper limit minus lower limit, with the lower-limit value in brackets so its signs survive.' })
})

g('logsolve', 'p1.14', 'P6.5', 2, 'Solving a^x = b', (r, q) => {
  const a = r.pick([2, 3, 5, 7]), b = r.pick([10, 12, 20, 30, 40, 50, 60, 75, 90, 100, 150, 200]), lin = r.next() < 0.4
  const base = Math.log(b) / Math.log(a), val = lin ? (base - 1) / 2 : base
  return q.num(L`Solve $${a}^{${lin ? '2x + 1' : 'x'}} = ${b}$, giving your answer to 3 significant figures.`, val,
    L`Take logs: $${lin ? '(2x + 1)' : 'x'}\ln ${a} = \ln ${b}$, so $${lin ? '2x + 1' : 'x'} = \dfrac{\ln ${b}}{\ln ${a}} = ${fmtSf(base, 4)}$${lin ? L`, giving $x = ${fmtSf(val)}$` : ''}.`,
    { v: lin ? `(log(${b})/log(${a}) - 1)/2` : `log(${b})/log(${a})`, err: 'Do not round the intermediate value before the final step.' })
})

g('logeval', 'p1.14', 'P6.3', 2, 'Evaluating a logarithm', (r, q) => {
  const c = r.pick([2, 3, 5]), i = r.int(1, 3), j = r.nz(-3, 4)
  const B = Math.pow(c, i), arg = j > 0 ? `${Math.pow(c, j)}` : `\\frac{1}{${Math.pow(c, -j)}}`
  return q.num(L`Evaluate $\log_{${B}} ${arg}$. Give an exact answer.`, j / i,
    L`Write both as powers of ${c}: $${B} = ${c}^{${i}}$ and $${arg} = ${c}^{${j}}$. If $(${c}^{${i}})^k = ${c}^{${j}}$ then $${i}k = ${j}$, so $k = ${fr(j, i)}$.`,
    { exact: true, v: `log(Rational(${c})**(${j}), ${B})`, memo: 'memorise' })
})

g('loglaws', 'p1.14', 'P6.4', 2, 'Laws of logarithms', (r, q) => {
  const p = r.int(2, 5), qv = r.int(2, 9), d = r.pick([2, 3, 4, 6])
  return q.num(L`$2\log_a ${p} + \log_a ${qv} - \log_a ${d} = \log_a k$. Find $k$ as an exact value.`, (p * p * qv) / d,
    L`$2\log_a ${p} = \log_a ${p * p}$. Adding logs multiplies, subtracting divides: $k = \dfrac{${p * p} \times ${qv}}{${d}} = ${fr(p * p * qv, d)}$.`,
    { exact: true, v: `Rational(${p}**2*${qv}, ${d})`, err: L`$2\log_a ${p}$ is $\log_a ${p}^2$, not $\log_a ${2 * p}$.`, memo: 'memorise' })
})

g('logdomain', 'p1.14', 'P6.4,P6.5', 4, 'Log equations: which solutions are valid?', (r, q) => {
  const kind = r.int(0, 2)
  if (kind < 2) {
    const [u, v, a, k] = r.pick([[1, 4, 2, 2], [1, 8, 2, 3], [2, 4, 2, 3], [1, 9, 3, 2], [1, 3, 3, 1], [1, 2, 2, 1], [2, 8, 2, 4], [1, 16, 2, 4], [1, 5, 5, 1], [2, 3, 6, 1], [3, 9, 3, 3], [4, 8, 2, 5]])
    const root = -r.int(1, 4), qq = u - root, p = v - root, r2 = root - u - v, N = Math.pow(a, k)
    return q.mcq(L`Solve $\log_{${a}}(x + ${p}) + \log_{${a}}(x + ${qq}) = ${k}$.`,
      [L`$x = ${root}$ only`, L`$x = ${r2}$ only`, L`$x = ${root}$ and $x = ${r2}$`, 'No solutions, because both values are negative'],
      L`Combine: $\log_{${a}}\big((x + ${p})(x + ${qq})\big) = ${k} \Rightarrow (x + ${p})(x + ${qq}) = ${N}$ $\Rightarrow x^2 + ${p + qq}x + ${p * qq - N} = 0 \Rightarrow x = ${root}$ or $x = ${r2}$. **Check each in the original logs.** $x = ${root}$: $x + ${p} = ${root + p} > 0$ and $x + ${qq} = ${root + qq} > 0$, so it is valid even though $x$ is negative. $x = ${r2}$: $x + ${qq} = ${r2 + qq} < 0$, so $\log$ is undefined and it is rejected.`,
      { v: { s: `Integer((${root}+${p}>0) and (${root}+${qq}>0) and ((${root}+${p})*(${root}+${qq})==${a}**${k}) and (${r2}+${qq}<0) and ((${r2}+${p})*(${r2}+${qq})==${a}**${k}))`, val: 1 },
        err: 'Your tracked slip. A solution is rejected only if it makes the ARGUMENT of a log zero or negative. A negative $x$ is fine if every bracket stays positive.' })
  }
  const a = r.pick([2, 3, 5]), k = r.int(1, 3), sq = r.next() < 0.5, val = Math.pow(a, k)
  return q.mcq(sq ? L`Solve $\log_{${a}}(x^2) = ${2 * k}$.` : L`Solve $2\log_{${a}} x = ${2 * k}$.`,
    sq ? [L`$x = ${val}$ and $x = -${val}$`, L`$x = ${val}$ only`, L`$x = -${val}$ only`, L`$x = ${val * val}$ only`]
       : [L`$x = ${val}$ only`, L`$x = ${val}$ and $x = -${val}$`, L`$x = -${val}$ only`, L`$x = ${val * val}$ only`],
    sq ? L`$x^2 = ${a}^{${2 * k}} = ${val * val}$, so $x = \pm ${val}$. Check the argument: $x^2 = ${val * val} > 0$ for both, so **both are valid**. The negative solution is fine here because it is $x^2$, not $x$, inside the log.`
       : L`$\log_{${a}} x = ${k} \Rightarrow x = ${val}$. Here $x$ itself is inside the log, so $x > 0$ is required and $x = -${val}$ is not a solution. Compare with $\log_{${a}}(x^2) = ${2 * k}$, where $x = -${val}$ would be valid: $2\log x$ and $\log x^2$ have different domains.`,
    { v: { s: sq ? `Integer(((${val})**2 == ${a}**${2 * k}) and ((-${val})**2 == ${a}**${2 * k}))` : `Integer(solve(2*log(xp, ${a}) - ${2 * k}, xp) == [${val}])`, val: 1 },
      err: 'Your tracked slip. Test each solution against the domain of the ORIGINAL logs. Do not apply a blanket "negatives are invalid" rule.' })
}, { weak: 'logdomain' })

g('expmodel', 'p1.14', 'P6.7', 3, 'Exponential decay model', (r, q) => {
  const A = r.pick([200, 400, 500, 800, 1000]), k = r.pick([0.05, 0.1, 0.2, 0.25, 0.4]), N = A / r.pick([2, 4, 5, 8, 10]), val = Math.log(A / N) / k
  return q.num(L`The mass $m$ grams of a substance after $t$ hours is modelled by $m = ${A}e^{-${k}t}$. Find the value of $t$ when $m = ${N}$, to 3 significant figures.`, val,
    L`$${N} = ${A}e^{-${k}t} \Rightarrow e^{-${k}t} = ${fr(N, A)} \Rightarrow -${k}t = \ln\left(${fr(N, A)}\right) \Rightarrow t = \dfrac{\ln ${A / N}}{${k}} = ${fmtSf(val)}$.`,
    { v: `log(Rational(${A},${N}))/Rational(${Math.round(k * 100)},100)`, err: 'Divide by the coefficient first, then take ln of both sides.' })
})

g('loglinear', 'p1.14', 'P6.6', 3, 'Logarithmic graphs', (r, q) => {
  const m = r.pick([0.1, 0.2, 0.3, 0.4, 0.5]), c = r.pick([0.5, 1.2, 1.5, 2, 2.3]), askA = r.next() < 0.5
  return q.num(L`A graph of $\log_{10} y$ against $x$ is a straight line with gradient $${m}$ and intercept $${c}$. The relationship is $y = ab^x$. Find $${askA ? 'a' : 'b'}$ to 3 significant figures.`, Math.pow(10, askA ? c : m),
    L`$\log_{10} y = \log_{10} a + x\log_{10} b$. So $\log_{10} a = ${c}$ and $\log_{10} b = ${m}$: $${askA ? `a = 10^{${c}}` : `b = 10^{${m}}`} = ${fmtSf(Math.pow(10, askA ? c : m))}$.`,
    { v: `10**Rational(${Math.round((askA ? c : m) * 10)},10)`, err: 'For $y = ab^x$ plot $\\log y$ against $x$; for $y = ax^n$ plot $\\log y$ against $\\log x$.' })
})

// ---------- Year 2 ----------
g('pf', 'p2.1', 'P2.10', 3, 'Partial fractions', (r, q) => {
  const A = r.nz(-4, 5), B = r.nz(-4, 5), a = r.int(-4, 3), b = r.int(a + 1, 5)
  const p = A + B, c = A * b + B * a
  return q.num(L`$\dfrac{${polyTex([p, c])}}{(x ${sg(a)})(x ${sg(b)})} \equiv \dfrac{A}{x ${sg(a)}} + \dfrac{B}{x ${sg(b)}}$. Find $A$.`.replace(/x \+ 0/g, 'x'), A,
    L`$${polyTex([p, c])} \equiv A(x ${sg(b)}) + B(x ${sg(a)})$. Put $x = ${-a}$: $${p * -a + c} = A(${-a + b})$, so $A = ${A}$. (Then $x = ${-b}$ gives $B = ${B}$.)`.replace(/x \+ 0/g, 'x'),
    { exact: true, v: `((${p})*x+(${c}))/(x+(${b}))`.concat(`.subs(x, ${-a})`).replace(/^/, '(').replace(/\.subs/, ').subs'), err: 'Substitute the value that makes the OTHER bracket zero.' })
})

g('comp', 'p2.2', 'P2.8', 2, 'Composite functions', (r, q) => {
  const a = r.nz(-4, 4), b = r.int(-6, 6), c = r.int(-6, 6), k = r.int(-3, 3), fg = r.next() < 0.5
  const val = fg ? a * (k * k + c) + b : (a * k + b) ** 2 + c
  return q.num(L`$f(x) = ${polyTex([a, b])}$ and $g(x) = ${polyTex([1, 0, c])}$. Find $${fg ? 'fg' : 'gf'}(${k})$.`, val,
    fg ? L`$fg(${k})$ means $g$ first: $g(${k}) = ${k * k + c}$. Then $f(${k * k + c}) = ${val}$.` : L`$gf(${k})$ means $f$ first: $f(${k}) = ${a * k + b}$. Then $g(${a * k + b}) = ${val}$.`,
    { exact: true, v: fg ? `(${a})*((${k})**2+(${c}))+(${b})` : `((${a})*(${k})+(${b}))**2+(${c})`, err: '$fg(x)$ means apply $g$ first, then $f$.' })
})

g('inverse', 'p2.2', 'P2.8', 3, 'Inverse functions', (r, q) => {
  const a = r.nz(-3, 4), c = r.nz(-4, 4), b = r.pick([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].filter((x) => x !== a * c)), k = r.pick([-3, -2, -1, 0, 1, 2, 3, 5].filter((x) => x !== a))
  return q.num(L`$f(x) = \dfrac{${polyTex([a, b])}}{x ${sg(c)}},\ x \ne ${-c}$. Find $f^{-1}(${k})$ as an exact value.`, (b - k * c) / (k - a),
    L`Solve $f(x) = ${k}$: $${polyTex([a, b])} = ${k}(x ${sg(c)}) \Rightarrow ${polyTex([a - k, 0])} = ${k * c - b} \Rightarrow x = ${fr(k * c - b, a - k)}$.`,
    { exact: true, v: `solve(Eq(((${a})*x+(${b}))/(x+(${c})), ${k}), x)[0]`, err: '$f^{-1}(k)$ is the $x$ that gives output $k$. You do not need the whole inverse function.' })
})

g('modsolve', 'p2.2', 'P2.7', 3, 'Modulus equations', (r, q) => {
  const a = r.pick([1, 2, 3, 4]), b = r.int(-7, 7), c = r.int(1, 9), small = r.next() < 0.5
  const s1 = (c - b) / a, s2 = (-c - b) / a
  return q.num(L`Solve $|${polyTex([a, b])}| = ${c}$. Give the ${small ? 'smaller' : 'larger'} solution as an exact value.`, small ? Math.min(s1, s2) : Math.max(s1, s2),
    L`Two cases: $${polyTex([a, b])} = ${c} \Rightarrow x = ${fr(c - b, a)}$, or $${polyTex([a, b])} = -${c} \Rightarrow x = ${fr(-c - b, a)}$.`,
    { exact: true, v: `${small ? 'min' : 'max'}(solve(Abs((${a})*xr+(${b})) - ${c}, xr))`, err: 'A modulus equation with a positive right-hand side has two cases.' })
})

g('arith', 'p2.3', 'P4.4', 2, 'Arithmetic series', (r, q) => {
  const a = r.int(-10, 20), d = r.nz(-6, 7), n = r.int(10, 30), sum = r.next() < 0.6
  return q.num(L`An arithmetic series has first term $${a}$ and common difference $${d}$. Find ${sum ? `the sum of the first $${n}$ terms` : `the $${n}$th term`}.`,
    sum ? (n / 2) * (2 * a + (n - 1) * d) : a + (n - 1) * d,
    sum ? L`$S_n = \tfrac{n}{2}\big(2a + (n-1)d\big) = \tfrac{${n}}{2}\big(${2 * a} + ${n - 1} \times ${P(d)}\big) = ${(n / 2) * (2 * a + (n - 1) * d)}$.`
        : L`$u_n = a + (n-1)d = ${a} + ${n - 1} \times ${P(d)} = ${a + (n - 1) * d}$.`,
    { exact: true, v: sum ? `sum(${a} + (${d})*i for i in range(${n}))` : `${a} + (${d})*(${n}-1)`, err: 'It is $(n - 1)d$, not $nd$.', memo: sum ? 'booklet' : 'memorise' })
})

g('geo', 'p2.3', 'P4.5', 3, 'Geometric series', (r, q) => {
  const a = r.pick([2, 3, 5, 8, 12, 20, 48, 100]), [rn, rd] = r.pick([[1, 2], [1, 3], [2, 3], [3, 4], [-1, 2], [3, 5], [-2, 3], [1, 4]]), inf = r.next() < 0.5, n = r.int(5, 10)
  const rr = rn / rd, val = inf ? a / (1 - rr) : (a * (1 - Math.pow(rr, n))) / (1 - rr)
  return q.num(L`A geometric series has first term $${a}$ and common ratio $${fr(rn, rd)}$. Find ${inf ? 'the sum to infinity' : `the sum of the first $${n}$ terms, to 3 significant figures`}.`, val,
    inf ? L`$|r| < 1$, so $S_\infty = \dfrac{a}{1 - r} = \dfrac{${a}}{1 - \left(${fr(rn, rd)}\right)} = ${fr(a * rd, rd - rn)}$.`
        : L`$S_n = \dfrac{a(1 - r^n)}{1 - r} = \dfrac{${a}\left(1 - \left(${fr(rn, rd)}\right)^{${n}}\right)}{1 - \left(${fr(rn, rd)}\right)} = ${fmtSf(val)}$.`,
    { exact: inf, v: inf ? `summation(${a}*Rational(${rn},${rd})**n, (n, 0, oo))` : `sum(${a}*Rational(${rn},${rd})**i for i in range(${n}))`, err: 'With a negative ratio, bracket $r$ before raising to the power.', memo: 'booklet' })
})

g('sigma', 'p2.3', 'P4.3', 2, 'Sigma notation', (r, q) => {
  const a = r.nz(-4, 5), b = r.int(-6, 8), N = r.int(8, 25)
  const val = (a * N * (N + 1)) / 2 + b * N
  return q.num(L`Evaluate $\displaystyle\sum_{r=1}^{${N}} (${polyTex([a, b], 'r')})$.`, val,
    L`This is an arithmetic series: first term $${a + b}$, last term $${a * N + b}$, $${N}$ terms. $S = \tfrac{${N}}{2}(${a + b} + ${P(a * N + b)}) = ${val}$.`,
    { exact: true, v: `summation((${a})*n+(${b}), (n, 1, ${N}))` })
})

g('recur', 'p2.3', 'P4.2', 2, 'Recurrence relations', (r, q) => {
  const a = r.pick([-2, -1, 2, 3]), b = r.int(-5, 5), u1 = r.int(-3, 4)
  const u = [u1]; for (let i = 0; i < 3; i++) u.push(a * u[i] + b)
  return q.num(L`A sequence is defined by $u_{n+1} = ${polyTex([a, b], 'u_n')}$, $u_1 = ${u1}$. Find $u_4$.`, u[3],
    L`$u_2 = ${u[1]}$, $u_3 = ${u[2]}$, $u_4 = ${u[3]}$.`, { exact: true, v: `iterate(lambda u: (${a})*u+(${b}), ${u1}, 3)` })
})

g('binom2', 'p2.4', 'P4.1', 4, 'Binomial expansion, rational n', (r, q) => {
  const [nn, nd] = r.pick([[-1, 1], [-2, 1], [-3, 1], [1, 2], [-1, 2], [1, 3], [3, 2]]), a = r.nz(-4, 4), k = r.pick([2, 3])
  const n = nn / nd, coef = k === 2 ? (n * (n - 1)) / 2 : (n * (n - 1) * (n - 2)) / 6
  return q.num(L`Find the coefficient of $x^{${k}}$ in the binomial expansion of $(1 ${sg(a, 'x')})^{${nd === 1 ? nn : fr(nn, nd)}}$. Give an exact answer.`, coef * Math.pow(a, k),
    L`Coefficient $= \dfrac{n(n-1)${k === 3 ? '(n-2)' : ''}}{${k}!}(${a})^{${k}}$ with $n = ${fr(nn, nd)}$. This gives $${fmt(+(coef * Math.pow(a, k)).toFixed(6))}$. Valid for $|x| < ${fr(1, Math.abs(a))}$.`,
    { exact: true, tol: 1e-6, v: `series((1+(${a})*x)**Rational(${nn},${nd}), x, 0, 5).removeO().coeff(x, ${k})`, err: L`Use $(${a}x)^{${k}}$, including the sign, and state the range of validity.`, memo: 'booklet' })
})

g('binomfactor', 'p2.4', 'P4.1', 4, 'Binomial: taking out a factor first', (r, q) => {
  const p = r.pick([2, 3]), a = r.nz(-3, 3), val = a / (2 * p)
  return q.num(L`Find the coefficient of $x$ in the binomial expansion of $(${p * p} ${sg(a, 'x')})^{\frac12}$. Give an exact answer.`, val,
    L`Take out $${p * p}$ first: $(${p * p})^{\frac12}\left(1 ${sg(a / (p * p) < 0 ? -1 : 1)}\frac{${Math.abs(a)}}{${p * p}}x\right)^{\frac12}$ $= ${p}\left(1 + \tfrac12 \cdot \left(${fr(a, p * p)}\right)x + \dots\right)$. Coefficient of $x$ $= ${p} \times \tfrac12 \times ${fr(a, p * p)} = ${fr(a, 2 * p)}$.`.replace('+ 1\\frac', '+ \\frac').replace('- 1\\frac', '- \\frac'),
    { exact: true, v: `series((${p * p}+(${a})*x)**Rational(1,2), x, 0, 3).removeO().coeff(x, 1)`, err: 'The formula needs $(1 + \\dots)^n$. Factor out the constant and remember to raise it to the power $n$ as well.' })
})

g('sector', 'p2.5', 'P5.1', 2, 'Arc length and sector area', (r, q) => {
  const rad = r.int(3, 12), th = r.pick([0.4, 0.6, 0.8, 1.1, 1.2, 1.5, 1.8, 2.1, 2.5]), kind = r.int(0, 2)
  const val = kind === 0 ? rad * th : kind === 1 ? 0.5 * rad * rad * th : 2 * rad + rad * th
  return q.num(L`A sector of a circle has radius $${rad}$ cm and angle $${th}$ radians. Find its ${['arc length', 'area', 'perimeter'][kind]}.`, val,
    kind === 0 ? L`$l = r\theta = ${rad} \times ${th} = ${fmt(val)}$ cm.` : kind === 1 ? L`$A = \tfrac12 r^2\theta = \tfrac12 \times ${rad}^2 \times ${th} = ${fmt(val)}$ cm$^2$.` : L`Perimeter $= 2r + r\theta = ${2 * rad} + ${fmt(rad * th)} = ${fmt(val)}$ cm.`,
    { v: kind === 0 ? `${rad}*Rational(${Math.round(th * 10)},10)` : kind === 1 ? `Rational(1,2)*${rad}**2*Rational(${Math.round(th * 10)},10)` : `2*${rad}+${rad}*Rational(${Math.round(th * 10)},10)`,
      unit: kind === 1 ? 'cm^2' : 'cm', dia: { k: 'sector', angle: th, r: `${rad} cm`, theta: `${th}` }, err: 'These formulae only work in radians. The perimeter includes the two radii.', memo: 'memorise' })
})

g('smallangle', 'p2.5', 'P5.2', 3, 'Small angle approximations', (r, q) => {
  const k = r.int(2, 5), m = r.int(1, 4)
  return q.num(L`When $\theta$ is small, $\dfrac{1 - \cos ${k}\theta}{\theta \sin ${m === 1 ? '' : m}\theta} \approx c$. Find the exact value of $c$.`, (k * k) / (2 * m),
    L`$\cos ${k}\theta \approx 1 - \frac{(${k}\theta)^2}{2}$ and $\sin ${m === 1 ? '' : m}\theta \approx ${m === 1 ? '' : m}\theta$. So the fraction $\approx \dfrac{\frac{${k * k}\theta^2}{2}}{${m === 1 ? '' : m}\theta^2} = ${fr(k * k, 2 * m)}$.`,
    { exact: true, v: `limit((1-cos(${k}*x))/(x*sin(${m}*x)), x, 0)`, err: L`$\cos k\theta \approx 1 - \frac{(k\theta)^2}{2}$: square the $k$ as well.`, memo: 'booklet' })
})

g('recip', 'p2.6', 'P5.4', 3, 'Solving sec, cosec, cot equations', (r, q) => {
  const f = r.pick(['sec', 'cosec', 'cot'] as const), k = f === 'cot' ? (r.next() < 0.5 ? -1 : 1) * r.pick([0.5, 0.8, 1.5, 2, 3]) : (r.next() < 0.5 ? -1 : 1) * r.pick([1.5, 2.5, 3, 4, 5])
  const d = (x: number) => (x * 180) / Math.PI
  let first: number
  if (f === 'sec') first = d(Math.acos(1 / k))
  else if (f === 'cosec') { const b = d(Math.asin(1 / k)); first = k > 0 ? b : 180 - b }
  else { const b = d(Math.atan(1 / k)); first = k > 0 ? b : b + 180 }
  const py = f === 'sec' ? '1/cos(rad(x))' : f === 'cosec' ? '1/sin(rad(x))' : 'cos(rad(x))/sin(rad(x))'
  const basic = f === 'sec' ? 'cos' : f === 'cosec' ? 'sin' : 'tan'
  return q.num(L`Solve $${'\\' + (f === 'cosec' ? 'operatorname{cosec}' : f)}\, x = ${k}$ for $0 \le x < 360^\circ$. Give the smallest solution to 1 decimal place.`, first,
    L`Rewrite: $${'\\' + (basic)} x = \dfrac{1}{${k}} = ${fmtSf(1 / k, 4)}$. Solve as usual and list the solutions in range; the smallest is $${first.toFixed(1)}^\circ$.`,
    { tol: 0.05, unit: '°', v: `min(roots('${py}-(${k})', 0, 360))`, err: 'Convert to sin, cos or tan first. $\\sec x = \\frac{1}{\\cos x}$, it is not $\\cos^{-1} x$.', memo: 'memorise' })
})

g('rform', 'p2.7', 'P5.6', 3, 'R sin(x + α) form', (r, q) => {
  const a = r.int(1, 9), b = r.int(1, 9), kind = r.int(0, 2), R = Math.hypot(a, b), al = (Math.atan(b / a) * 180) / Math.PI
  const stem = L`$${a === 1 ? '' : a}\sin x + ${b === 1 ? '' : b}\cos x \equiv R\sin(x + \alpha)$, where $R > 0$ and $0 < \alpha < 90^\circ$. `
  const sol = L`Expand: $R\sin x\cos\alpha + R\cos x\sin\alpha$. So $R\cos\alpha = ${a}$, $R\sin\alpha = ${b}$. $R = \sqrt{${a}^2 + ${b}^2} = ${fmtSf(R)}$ and $\tan\alpha = \frac{${b}}{${a}}$, $\alpha = ${al.toFixed(1)}^\circ$.`
  if (kind === 0) return q.num(stem + 'Find $R$ to 3 significant figures.', R, sol, { v: `sqrt(${a}**2+${b}**2)`, memo: 'memorise' })
  if (kind === 1) return q.num(stem + L`Find $\alpha$ to 1 decimal place.`, al, sol, { tol: 0.05, unit: '°', v: `deg(atan(Rational(${b},${a})))`, err: L`$\tan\alpha$ is (coefficient of cos) ÷ (coefficient of sin) for the $R\sin(x+\alpha)$ form. Check by expanding.` })
  const c = r.int(2, 9)
  return q.num(stem + L`Hence find the maximum value of $\dfrac{${c * 10}}{${Math.ceil(R) + c} + ${a === 1 ? '' : a}\sin x + ${b === 1 ? '' : b}\cos x}$ to 3 significant figures.`, (c * 10) / (Math.ceil(R) + c - R),
    sol + L` The fraction is largest when the denominator is smallest, i.e. when $R\sin(x+\alpha) = -R$: $\dfrac{${c * 10}}{${Math.ceil(R) + c} - ${fmtSf(R)}} = ${fmtSf((c * 10) / (Math.ceil(R) + c - R))}$.`,
    { v: `${c * 10}/(${Math.ceil(R) + c} - sqrt(${a}**2+${b}**2))`, err: 'Maximum of a fraction comes from the MINIMUM of its denominator.' })
})

g('double', 'p2.7', 'P5.6', 3, 'Double-angle formulae', (r, q) => {
  const [p, b, h] = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [7, 24, 25], [24, 7, 25]]), obt = r.next() < 0.4, which = r.pick(['sin', 'cos'] as const)
  const s = p / h, c = (obt ? -1 : 1) * (b / h), val = which === 'sin' ? 2 * s * c : 1 - 2 * s * s
  const th = obt ? `(pi-asin(Rational(${p},${h})))` : `asin(Rational(${p},${h}))`
  return q.num(L`Given that $\sin\theta = \frac{${p}}{${h}}$ and $\theta$ is ${obt ? 'obtuse' : 'acute'}, find the exact value of $${'\\' + (which)} 2\theta$.`, val,
    L`$\cos\theta = ${obt ? '-' : ''}\frac{${b}}{${h}}$ (${obt ? 'negative, because $\\theta$ is obtuse' : 'positive, because $\\theta$ is acute'}). ` +
    (which === 'sin' ? L`$\sin 2\theta = 2\sin\theta\cos\theta = 2 \times \frac{${p}}{${h}} \times \left(${obt ? '-' : ''}\frac{${b}}{${h}}\right) = ${fr((obt ? -2 : 2) * p * b, h * h)}$.` : L`$\cos 2\theta = 1 - 2\sin^2\theta = 1 - 2\left(\frac{${p}}{${h}}\right)^2 = ${fr(h * h - 2 * p * p, h * h)}$.`),
    { exact: true, tol: 1e-9, v: `${which}(2*${th})`, err: 'The double-angle formulae are NOT in the formula booklet. Decide the sign of $\\cos\\theta$ from the quadrant.', memo: 'memorise' })
})

g('paramgrad', 'p2.8', 'P3.3,P7.5', 3, 'Parametric differentiation', (r, q) => {
  const a = r.nz(-3, 4), b = r.nz(-3, 3), c = r.int(-5, 5), k = r.nz(-2, 3)
  return q.num(L`A curve has parametric equations $x = ${co(a, 't^2')}$, $y = ${co(b, 't^3')} ${c ? sg(c, 't') : ''}$. Find $\dfrac{dy}{dx}$ when $t = ${k}$, as an exact value.`, (3 * b * k * k + c) / (2 * a * k),
    L`$\dfrac{dy}{dx} = \dfrac{dy/dt}{dx/dt} = \dfrac{${polyTex([3 * b, 0, c], 't')}}{${co(2 * a, 't')}}$. At $t = ${k}$: $\dfrac{${3 * b * k * k + c}}{${2 * a * k}} = ${fr(3 * b * k * k + c, 2 * a * k)}$.`,
    { exact: true, v: `(diff((${b})*t**3+(${c})*t, t)/diff((${a})*t**2, t)).subs(t, ${k})`, err: 'It is $\\frac{dy}{dt} \\div \\frac{dx}{dt}$, not the other way up.', memo: 'memorise' })
})

g('paramcart', 'p2.8', 'P3.3', 3, 'Parametric to Cartesian', (r, q) => {
  const a = r.nz(-4, 4), b = r.int(2, 5), c = r.int(-5, 5), X = r.int(-3, 6)
  const t = X - a, val = b * t * t + c
  return q.num(L`A curve has parametric equations $x = t ${sg(a)}$, $y = ${b}t^2 ${c ? sg(c) : ''}$. Find the $y$-coordinate of the point on the curve where $x = ${X}$.`, val,
    L`$t = x ${sg(-a)}$, so the Cartesian equation is $y = ${b}(x ${sg(-a)})^2 ${c ? sg(c) : ''}$. At $x = ${X}$: $t = ${t}$ and $y = ${b}(${t})^2 ${c ? sg(c) : ''} = ${val}$.`,
    { exact: true, v: `((${b})*t**2+(${c})).subs(t, solve(t+(${a})-(${X}), t)[0])` })
})

g('chain', 'p2.9', 'P7.4', 2, 'Chain rule', (r, q) => {
  const a = r.pick([2, 3, 4, 5]), b = r.nz(-7, 7), n = r.pick([3, 4, 5, 6, -1, -2])
  return q.expr(L`Differentiate $y = (${polyTex([a, b])})^{${n}}$ with respect to $x$.`, L`${a * n}(${polyTex([a, b])})^{${n - 1}}`,
    L`Chain rule: bring down the power, reduce it by one, multiply by the derivative of the bracket ($${a}$): $\dfrac{dy}{dx} = ${n} \times ${a}\,(${polyTex([a, b])})^{${n - 1}} = ${a * n}(${polyTex([a, b])})^{${n - 1}}$.`,
    { v: `diff(((${a})*x+(${b}))**(${n}), x)`, range: [2.1, 3.4], err: 'Multiply by the derivative of the inside bracket.', memo: 'memorise' })
})

g('diffexptrig', 'p2.9', 'P7.2,P7.4', 2, 'Differentiating e^kx, sin kx, cos kx', (r, q) => {
  const a = r.nz(-4, 5), k = r.pick([2, 3, 4, 5]), b = r.nz(-4, 5), m = r.pick([2, 3, 4]), tr = r.pick(['sin', 'cos'] as const)
  const d = S([[a * k, (c) => cx(c, `e^{${k}x}`)], [tr === 'sin' ? b * m : -b * m, (c) => cx(c, `\\${tr === 'sin' ? 'cos' : 'sin'} ${m}x`)]])
  return q.expr(L`Differentiate $y = ${S([[a, (c) => cx(c, `e^{${k}x}`)], [b, (c) => cx(c, `\\${tr} ${m}x`)]])}$ with respect to $x$.`, d,
    L`$\frac{d}{dx}e^{kx} = ke^{kx}$, $\frac{d}{dx}\sin kx = k\cos kx$, $\frac{d}{dx}\cos kx = -k\sin kx$. So $\dfrac{dy}{dx} = ${d}$.`,
    { v: `diff((${a})*exp(${k}*x) + (${b})*${tr}(${m}*x), x)`, err: 'cos differentiates to MINUS sin. Multiply by $k$ each time.', memo: 'memorise' })
})

g('product', 'p2.9', 'P7.4', 3, 'Product rule', (r, q) => {
  const n = r.int(2, 4), k = r.pick([2, 3, 4, -1, -2]), kind = r.int(0, 2)
  if (kind === 0) return q.expr(L`Differentiate $y = x^{${n}}e^{${k}x}$ with respect to $x$.`, L`${n}${pw("x", n - 1)}e^{${k}x} ${sg(k, `x^{${n}}e^{${k}x}`)}`,
    L`Product rule $uv' + vu'$ with $u = x^{${n}}$, $v = e^{${k}x}$: $\dfrac{dy}{dx} = x^{${n}} \cdot ${k}e^{${k}x} + e^{${k}x} \cdot ${n}${pw("x", n - 1)} = ${pw("x", n - 1)}e^{${k}x}(${n} ${sg(k, 'x')})$.`,
    { v: `diff(x**${n}*exp((${k})*x), x)`, memo: 'memorise', err: 'The product rule is NOT in the formula booklet.' })
  if (kind === 1) { const m = Math.abs(k); return q.expr(L`Differentiate $y = x^{${n}}\sin ${m}x$ with respect to $x$.`, L`${n}${pw("x", n - 1)}\sin ${m}x + ${m}x^{${n}}\cos ${m}x`,
    L`$u = x^{${n}}$, $v = \sin ${m}x$: $\dfrac{dy}{dx} = ${n}${pw("x", n - 1)}\sin ${m}x + ${m}x^{${n}}\cos ${m}x$.`, { v: `diff(x**${n}*sin(${m}*x), x)`, memo: 'memorise' }) }
  return q.expr(L`Differentiate $y = x^{${n}}\ln x$ with respect to $x$.`, L`${n}${pw("x", n - 1)}\ln x + ${pw("x", n - 1)}`,
    L`$u = x^{${n}}$, $v = \ln x$: $\dfrac{dy}{dx} = ${n}${pw("x", n - 1)}\ln x + x^{${n}} \cdot \frac1x = ${n}${pw("x", n - 1)}\ln x + ${pw("x", n - 1)}$.`, { v: `diff(x**${n}*log(x), x)`, memo: 'memorise' })
})

g('quotient', 'p2.9', 'P7.4', 3, 'Quotient rule', (r, q) => {
  const a = r.nz(-4, 4), b = r.int(-5, 5), c = r.pick([1, 2, 3]), d = r.nz(-4, 4), k = r.pick([-2, -1, 0, 1, 2, 3].filter((x) => c * x + d !== 0))
  return q.num(L`$y = \dfrac{${polyTex([a, b])}}{${polyTex([c, d])}}$. Find the exact value of $\dfrac{dy}{dx}$ when $x = ${k}$.`, (a * d - b * c) / (c * k + d) ** 2,
    L`Quotient rule: $\dfrac{vu' - uv'}{v^2} = \dfrac{${a}(${polyTex([c, d])}) - ${c}(${polyTex([a, b])})}{(${polyTex([c, d])})^2} = \dfrac{${a * d - b * c}}{(${polyTex([c, d])})^2}$. At $x = ${k}$: $${fr(a * d - b * c, (c * k + d) ** 2)}$.`,
    { exact: true, v: `diff(((${a})*x+(${b}))/((${c})*x+(${d})), x).subs(x, ${k})`, err: 'Order matters on top: $vu\' - uv\'$ (bottom × derivative of top first).', memo: 'booklet' })
})

g('diffln', 'p2.9', 'P7.4', 2, 'Differentiating ln(f(x))', (r, q) => {
  const a = r.int(1, 5), b = r.int(1, 9)
  return q.expr(L`Differentiate $y = \ln(${polyTex([a, 0, b])})$ with respect to $x$.`, L`\frac{${2 * a}x}{${polyTex([a, 0, b])}}`,
    L`$\frac{d}{dx}\ln f(x) = \dfrac{f'(x)}{f(x)} = \dfrac{${2 * a}x}{${polyTex([a, 0, b])}}$.`, { v: `diff(log((${a})*x**2+${b}), x)`, memo: 'memorise' })
})

g('implicit', 'p2.9', 'P7.5', 4, 'Implicit differentiation', (r, q) => {
  let a = 0, p = 0, qq = 0
  do { a = r.nz(-3, 3); p = r.nz(-3, 3); qq = r.nz(-3, 3) } while (a * p + 2 * qq === 0)
  const c = p * p + a * p * qq + qq * qq
  return q.num(L`A curve has equation $x^2 ${sg(a, 'xy')} + y^2 = ${c}$. Find the exact gradient of the curve at the point $(${p}, ${qq})$.`, -(2 * p + a * qq) / (a * p + 2 * qq),
    L`Differentiate each term with respect to $x$ (product rule on $xy$): $2x ${sg(a)}\left(y + x\dfrac{dy}{dx}\right) + 2y\dfrac{dy}{dx} = 0$. So $\dfrac{dy}{dx} = -\dfrac{2x ${sg(a, 'y')}}{${co(a, 'x')} + 2y}$. At $(${p}, ${qq})$: $${fr(-(2 * p + a * qq), a * p + 2 * qq)}$.`,
    { exact: true, v: `idiff(x**2+(${a})*x*y+y**2-(${c}), y, x).subs({x: ${p}, y: ${qq}})`, err: 'The $xy$ term needs the product rule, and the constant differentiates to 0.' })
})

g('rates', 'p2.9', 'P7.4,P7.6', 3, 'Connected rates of change', (r, q) => {
  const rad = r.int(2, 12), dr = r.pick([0.1, 0.2, 0.25, 0.5, 2, 3]), sphere = r.next() < 0.5
  const val = sphere ? 4 * Math.PI * rad * rad * dr : 2 * Math.PI * rad * dr
  return q.num(sphere ? L`The radius of a sphere is increasing at $${dr}$ cm s$^{-1}$. Find the rate of increase of its volume when the radius is $${rad}$ cm. Give your answer to 3 significant figures. $\left[V = \tfrac43\pi r^3\right]$`
                      : L`The radius of a circular oil patch is increasing at $${dr}$ cm s$^{-1}$. Find the rate of increase of its area when the radius is $${rad}$ cm, to 3 significant figures.`, val,
    sphere ? L`$\dfrac{dV}{dt} = \dfrac{dV}{dr} \times \dfrac{dr}{dt} = 4\pi r^2 \times ${dr} = 4\pi(${rad})^2(${dr}) = ${fmtSf(val)}$ cm$^3$ s$^{-1}$.`
           : L`$\dfrac{dA}{dt} = \dfrac{dA}{dr} \times \dfrac{dr}{dt} = 2\pi r \times ${dr} = 2\pi(${rad})(${dr}) = ${fmtSf(val)}$ cm$^2$ s$^{-1}$.`,
    { v: sphere ? `diff(Rational(4,3)*pi*x**3, x).subs(x, ${rad})*Rational(${Math.round(dr * 100)},100)` : `diff(pi*x**2, x).subs(x, ${rad})*Rational(${Math.round(dr * 100)},100)`, err: 'Write the chain rule so the units cancel: $\\frac{dV}{dt} = \\frac{dV}{dr}\\cdot\\frac{dr}{dt}$.' })
})

g('inflection', 'p2.9', 'P7.1', 3, 'Point of inflection', (r, q) => {
  const a = 3 * r.nz(-4, 4), b = r.int(-6, 6), c = r.int(-6, 6)
  return q.num(L`Find the $x$-coordinate of the point of inflection of $y = ${polyTex([1, a, b, c])}$.`, -a / 3,
    L`$\dfrac{d^2y}{dx^2} = ${polyTex([6, 2 * a])} = 0 \Rightarrow x = ${-a / 3}$. The second derivative changes sign there (the curve goes from ${a ? 'concave to convex' : 'concave to convex'}), so it is a point of inflection.`,
    { exact: true, v: `solve(diff(${polyPy([1, a, b, c])}, x, 2), x)[0]`, err: 'Concave: $f\'\'(x) \\le 0$. Convex: $f\'\'(x) \\ge 0$. Inflection needs a change of sign of $f\'\'$.', memo: 'memorise' })
})

g('iter', 'p2.10', 'P9.2', 2, 'Iteration', (r, q) => {
  const a = r.int(2, 6), b = r.int(1, 9), x0 = r.int(1, 3), kind = r.int(0, 1)
  const f = kind === 0 ? (x: number) => Math.cbrt(a * x + b) : (x: number) => Math.sqrt(a + b / x)
  const x1 = f(x0), x2 = f(x1)
  return q.num(L`Using $x_{n+1} = ${kind === 0 ? `\\sqrt[3]{${a}x_n + ${b}}` : `\\sqrt{${a} + \\dfrac{${b}}{x_n}}`}$ with $x_0 = ${x0}$, find $x_2$ to 4 decimal places.`, x2,
    L`$x_1 = ${x1.toFixed(5)}$, $x_2 = ${x2.toFixed(4)}$. On the calculator: type $${x0}$ =, then enter the formula using Ans and press = repeatedly.`,
    { tol: 0.00005, v: kind === 0 ? `iterate(lambda u: (${a}*u+${b})**(1.0/3), ${x0}, 2)` : `iterate(lambda u: (${a}+${b}/u)**0.5, ${x0}, 2)`, err: 'Use the unrounded Ans value in each step.' })
})

g('newton', 'p2.10', 'P9.3', 3, 'Newton–Raphson', (r, q) => {
  const a = r.int(1, 6), b = -r.int(2, 12), x0 = r.int(1, 3)
  const f = x0 ** 3 + a * x0 + b, fp = 3 * x0 * x0 + a, val = x0 - f / fp
  return q.num(L`$f(x) = ${polyTex([1, 0, a, b])}$. Taking $x_0 = ${x0}$, apply the Newton–Raphson method once to find $x_1$, to 3 decimal places.`, val,
    L`$f'(x) = 3x^2 + ${a}$. $x_1 = x_0 - \dfrac{f(x_0)}{f'(x_0)} = ${x0} - \dfrac{${f}}{${fp}} = ${val.toFixed(3)}$.`,
    { tol: 0.0005, v: `${x0} - ${polyPy([1, 0, a, b])}.subs(x, ${x0})/diff(${polyPy([1, 0, a, b])}, x).subs(x, ${x0})`, err: 'It fails if $f\'(x_0) = 0$ (a stationary point) or is close to it.', memo: 'booklet' })
})

g('intstd', 'p2.11', 'P8.2', 2, 'Standard integrals', (r, q) => {
  const a = r.pick([2, 3, 4, 6, 8, 12]), k = r.pick([2, 3, 4]), kind = r.int(0, 4)
  const A = (body: string) => cf(a, k, body)
  if (kind === 0) return q.expr(L`Find $\displaystyle\int ${a}e^{${k}x}\,dx$.`, A(`e^{${k}x}`), L`$\int e^{kx}dx = \frac1k e^{kx}$, so the answer is $${A(`e^{${k}x}`)} + C$.`, { addC: true, v: `integrate(${a}*exp(${k}*x), x)`, memo: 'memorise' })
  if (kind === 1) return q.expr(L`Find $\displaystyle\int ${a}\cos ${k}x\,dx$.`, A(`\\sin ${k}x`), L`$\int \cos kx\,dx = \frac1k \sin kx$, so the answer is $${A(`\\sin ${k}x`)} + C$.`, { addC: true, v: `integrate(${a}*cos(${k}*x), x)`, memo: 'memorise' })
  if (kind === 2) return q.expr(L`Find $\displaystyle\int ${a}\sin ${k}x\,dx$.`, '-' + A(`\\cos ${k}x`), L`$\int \sin kx\,dx = -\frac1k \cos kx$, so the answer is $-${A(`\\cos ${k}x`)} + C$.`, { addC: true, v: `integrate(${a}*sin(${k}*x), x)`, err: 'Integrating sin gives MINUS cos.', memo: 'memorise' })
  const b = r.int(1, 7)
  if (kind === 3) return q.expr(L`Find $\displaystyle\int \frac{${a}}{${k}x + ${b}}\,dx$.`, A(`\\ln\\left|${k}x + ${b}\\right|`), L`$\int \frac{1}{kx + b}dx = \frac1k \ln|kx + b|$, so the answer is $${A(`\\ln|${k}x + ${b}|`)} + C$.`, { addC: true, v: `integrate(${a}/(${k}*x+${b}), x)`, err: 'Divide by the coefficient of $x$.', memo: 'memorise' })
  const n = r.int(2, 5)
  return q.expr(L`Find $\displaystyle\int (${k}x + ${b})^{${n}}\,dx$.`, L`\frac{(${k}x + ${b})^{${n + 1}}}{${k * (n + 1)}}`, L`Reverse chain rule: raise the power, divide by the new power and by the coefficient of $x$: $\dfrac{(${k}x + ${b})^{${n + 1}}}{${k * (n + 1)}} + C$.`, { addC: true, v: `integrate((${k}*x+${b})**${n}, x)`, memo: 'memorise' })
})

g('parts', 'p2.11', 'P8.5', 4, 'Integration by parts', (r, q) => {
  const k = r.pick([2, 3, 4]), kind = r.int(0, 2)
  if (kind === 0) return q.expr(L`Find $\displaystyle\int xe^{${k}x}\,dx$.`, L`\frac{1}{${k}}xe^{${k}x} - \frac{1}{${k * k}}e^{${k}x}`,
    L`$u = x$, $\frac{dv}{dx} = e^{${k}x}$, so $\frac{du}{dx} = 1$, $v = \frac{1}{${k}}e^{${k}x}$. $\int = \frac{1}{${k}}xe^{${k}x} - \int \frac{1}{${k}}e^{${k}x}dx = \frac{1}{${k}}xe^{${k}x} - \frac{1}{${k * k}}e^{${k}x} + C$.`, { addC: true, v: `integrate(x*exp(${k}*x), x)`, memo: 'booklet' })
  if (kind === 1) return q.expr(L`Find $\displaystyle\int x\cos ${k}x\,dx$.`, L`\frac{1}{${k}}x\sin ${k}x + \frac{1}{${k * k}}\cos ${k}x`,
    L`$u = x$, $\frac{dv}{dx} = \cos ${k}x$, $v = \frac{1}{${k}}\sin ${k}x$. $\int = \frac{1}{${k}}x\sin ${k}x - \int \frac{1}{${k}}\sin ${k}x\,dx = \frac{1}{${k}}x\sin ${k}x + \frac{1}{${k * k}}\cos ${k}x + C$.`, { addC: true, v: `integrate(x*cos(${k}*x), x)`, err: 'Two minus signs make a plus in the second term.', memo: 'booklet' })
  const n = r.int(1, 3)
  return q.expr(L`Find $\displaystyle\int x^{${n}}\ln x\,dx$.`.replace('x^{1}', 'x'), L`\frac{x^{${n + 1}}}{${n + 1}}\ln x - \frac{x^{${n + 1}}}{${(n + 1) ** 2}}`,
    L`With $\ln x$, choose $u = \ln x$ (it is easy to differentiate). $\frac{dv}{dx} = x^{${n}}$, $v = \frac{x^{${n + 1}}}{${n + 1}}$. $\int = \frac{x^{${n + 1}}}{${n + 1}}\ln x - \int \frac{x^{${n}}}{${n + 1}}dx = \frac{x^{${n + 1}}}{${n + 1}}\ln x - \frac{x^{${n + 1}}}{${(n + 1) ** 2}} + C$.`, { addC: true, v: `integrate(x**${n}*log(x), x)`, memo: 'booklet' })
})

g('intsub', 'p2.11', 'P8.5', 4, 'Integration by substitution', (r, q) => {
  const a = r.int(1, 5), p = r.int(1, 3)
  return q.num(L`Use the substitution $u = x^2 + ${a}$ to find $\displaystyle\int_0^{${p}} \frac{2x}{x^2 + ${a}}\,dx$, to 3 significant figures.`, Math.log((p * p + a) / a),
    L`$\frac{du}{dx} = 2x$, so $2x\,dx = du$. Limits: $x = 0 \to u = ${a}$; $x = ${p} \to u = ${p * p + a}$. $\displaystyle\int_{${a}}^{${p * p + a}} \frac1u\,du = \ln ${p * p + a} - \ln ${a} = \ln\frac{${p * p + a}}{${a}} = ${fmtSf(Math.log((p * p + a) / a))}$.`,
    { v: `integrate(2*x/(x**2+${a}), (x, 0, ${p}))`, err: 'Change the limits to $u$ values (or change back to $x$ before substituting).' })
})

g('trap', 'p2.11', 'P9.4', 2, 'Trapezium rule', (r, q) => {
  const a = r.int(1, 6), lo = r.int(0, 2), h = r.pick([0.5, 1]), n = 4
  const f = (x: number) => Math.sqrt(x ** 3 + a)
  const ys = Array.from({ length: n + 1 }, (_, i) => f(lo + i * h)), val = (h / 2) * (ys[0] + ys[n] + 2 * (ys[1] + ys[2] + ys[3]))
  return q.num(L`Use the trapezium rule with 4 strips to estimate $\displaystyle\int_{${lo}}^{${lo + n * h}} \sqrt{x^3 + ${a}}\,dx$, to 3 significant figures.`, val,
    L`$h = ${h}$. $y$ values: $${ys.map((y) => y.toFixed(4)).join(',\\ ')}$. Estimate $= \tfrac12(${h})\big[(${ys[0].toFixed(4)} + ${ys[4].toFixed(4)}) + 2(${ys[1].toFixed(4)} + ${ys[2].toFixed(4)} + ${ys[3].toFixed(4)})\big] = ${fmtSf(val)}$.`,
    { v: `trap(lambda u: (u**3+${a})**0.5, ${lo}, ${lo + n * h}, 4)`, err: '4 strips means 5 ordinates. Only the first and last are not doubled.', memo: 'booklet' })
})

g('area', 'p2.11', 'P8.3,P8.4', 3, 'Area under a curve', (r, q) => {
  const p = r.int(-3, 2), qq = p + r.int(2, 5), val = (qq - p) ** 3 / 6
  const cs = [-1, p + qq, -p * qq]
  return q.num(L`Find the exact area enclosed by the curve $y = ${polyTex(cs)}$ and the $x$-axis.`, val,
    L`Roots: $-(x ${sg(-p)})(x ${sg(-qq)}) = 0 \Rightarrow x = ${p}, ${qq}$. Area $= \displaystyle\int_{${p}}^{${qq}} (${polyTex(cs)})\,dx = ${fr((qq - p) ** 3, 6)}$.`,
    { exact: true, tol: 1e-9, v: `integrate(${polyPy(cs)}, (x, ${p}, ${qq}))`, dia: { k: 'graph', fns: [`-(x-(${p}))*(x-(${qq}))`], x: [p - 1, qq + 1], y: [-1, ((qq - p) / 2) ** 2 + 1], shade: [p, qq] }, err: 'Find where the curve crosses the axis first: those are the limits.' })
})

g('de', 'p2.11', 'P8.7', 4, 'Separable differential equations', (r, q) => {
  const kind = r.int(0, 1)
  if (kind === 0) {
    const k = r.pick([0.2, 0.5, -0.3, -0.5, 1.5]), A = r.int(2, 9), X = r.int(1, 4), val = A * Math.exp(k * X)
    return q.num(L`$\dfrac{dy}{dx} = ${k}y$ and $y = ${A}$ when $x = 0$. Find $y$ when $x = ${X}$, to 3 significant figures.`, val,
      L`Separate: $\int \frac1y\,dy = \int ${k}\,dx \Rightarrow \ln y = ${k}x + c \Rightarrow y = Ae^{${k}x}$. $y(0) = ${A}$ gives $A = ${A}$. $y(${X}) = ${A}e^{${fmt(k * X)}} = ${fmtSf(val)}$.`,
      { v: `ode(lambda u, w: ${k}*w, 0, ${A}, ${X})`, err: 'Put the constant in straight after integrating, then use the condition.' })
  }
  const a = r.int(1, 5), X = r.int(1, 5), val = Math.sqrt(X * X + a * a)
  return q.num(L`$\dfrac{dy}{dx} = \dfrac{x}{y}$, with $y > 0$, and $y = ${a}$ when $x = 0$. Find $y$ when $x = ${X}$, to 3 significant figures.`, val,
    L`Separate: $\int y\,dy = \int x\,dx \Rightarrow \tfrac12y^2 = \tfrac12x^2 + c$. $y(0) = ${a}$ gives $c = ${fr(a * a, 2)}$, so $y^2 = x^2 + ${a * a}$ and $y(${X}) = \sqrt{${X * X + a * a}} = ${fmtSf(val)}$.`,
    { v: `ode(lambda u, w: u/w, 0, ${a}, ${X})`, err: 'All the $y$ terms go with $dy$ before you integrate.' })
})

g('vec3', 'p2.12', 'P10.1,P10.3', 2, '3D vectors: distance', (r, q) => {
  const A = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)], B = [r.int(-5, 5), r.int(-5, 5), r.int(-5, 5)]
  if (A.join() === B.join()) B[0] += 3
  const d = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2])
  return q.num(L`Points $A$ and $B$ have coordinates $(${A.join(', ')})$ and $(${B.join(', ')})$. Find the distance $AB$ to 3 significant figures.`, d,
    L`$\overrightarrow{AB} = \begin{pmatrix}${B[0] - A[0]}\\${B[1] - A[1]}\\${B[2] - A[2]}\end{pmatrix}$, so $AB = \sqrt{${(B[0] - A[0]) ** 2} + ${(B[1] - A[1]) ** 2} + ${(B[2] - A[2]) ** 2}} = ${fmtSf(d)}$.`,
    { v: `sqrt((${B[0]}-(${A[0]}))**2+(${B[1]}-(${A[1]}))**2+(${B[2]}-(${A[2]}))**2)`, err: '$\\overrightarrow{AB} = \\mathbf{b} - \\mathbf{a}$. Square the differences, so their signs do not matter after that.' })
})

g('vecratio', 'p2.12', 'P10.4,P10.5', 3, 'Position vector of a dividing point', (r, q) => {
  const A = [r.int(-6, 6), r.int(-6, 6), r.int(-6, 6)], m = r.int(1, 3), n = r.int(1, 3), i = r.int(0, 2)
  const B = A.map((x) => x + (m + n) * r.nz(-2, 2)), P_ = A.map((x, j) => x + (m * (B[j] - x)) / (m + n))
  return q.num(L`$A$ has position vector $${A[0]}\mathbf{i} ${sg(A[1], '\\mathbf{j}')} ${sg(A[2], '\\mathbf{k}')}$ and $B$ has position vector $${B[0]}\mathbf{i} ${sg(B[1], '\\mathbf{j}')} ${sg(B[2], '\\mathbf{k}')}$. The point $P$ lies on $AB$ with $AP : PB = ${m} : ${n}$. Find the $\mathbf{${'ijk'[i]}}$ component of the position vector of $P$.`, P_[i],
    L`$\overrightarrow{OP} = \overrightarrow{OA} + \frac{${m}}{${m + n}}\overrightarrow{AB}$. $\mathbf{${'ijk'[i]}}$: $${A[i]} + \frac{${m}}{${m + n}}(${B[i]} - ${P(A[i])}) = ${P_[i]}$.`,
    { exact: true, v: `${A[i]} + Rational(${m},${m + n})*(${B[i]}-(${A[i]}))`, err: 'The fraction is $\\frac{m}{m+n}$ of the way along, not $\\frac{m}{n}$.' })
})
