/** Compact constructors and LaTeX/SymPy formatting helpers used by the content files. */
import type { CardItem, Diagram, ExprItem, Item, McqItem, NumericItem, SelfItem, Source, Verify, Weakness } from '../lib/types'
import { gcd } from '../lib/rng'

export interface Opt {
  v?: string | Verify; err?: string; memo?: 'memorise' | 'booklet'; dia?: Diagram; sf?: number; unit?: string
  exact?: boolean; tol?: number; t?: number; weak?: Weakness; src?: Source; vars?: string[]; addC?: boolean; range?: [number, number]
}
type D = 1 | 2 | 3 | 4 | 5

function base(id: string, topic: string, spec: string, diff: D, stem: string, solution: string, o: Opt = {}) {
  return {
    id, topic, spec: spec.split(',').map((s) => s.trim()), diff, stem, solution,
    err: o.err, memo: o.memo, source: o.src ?? ('original' as Source), diagram: o.dia, weak: o.weak, t: o.t,
    v: typeof o.v === 'string' ? { s: o.v } : o.v,
  }
}
export const num = (id: string, topic: string, spec: string, diff: D, stem: string, value: number, solution: string, o: Opt = {}): NumericItem =>
  ({ ...base(id, topic, spec, diff, stem, solution, o), type: 'numeric', value, sf: o.sf, exact: o.exact, unit: o.unit, tol: o.tol })
/** options[0] is the correct answer */
export const mcq = (id: string, topic: string, spec: string, diff: D, stem: string, options: string[], solution: string, o: Opt = {}): McqItem =>
  ({ ...base(id, topic, spec, diff, stem, solution, o), type: 'mcq', options })
export const method = (id: string, topic: string, spec: string, diff: D, stem: string, options: string[], solution: string, o: Opt = {}): McqItem =>
  ({ ...base(id, topic, spec, diff, stem, solution, o), type: 'method', options })
export const expr = (id: string, topic: string, spec: string, diff: D, stem: string, latex: string, solution: string, o: Opt = {}): ExprItem =>
  ({ ...base(id, topic, spec, diff, stem, solution, o), type: 'expr', latex, vars: o.vars ?? ['x'], addC: o.addC, range: o.range })
export const self = (id: string, topic: string, spec: string, diff: D, stem: string, marks: [string, string][], solution: string, o: Opt = {}): SelfItem =>
  ({ ...base(id, topic, spec, diff, stem, solution, { src: 'exam-style', ...o }), type: 'self', marks: marks.map(([code, text]) => ({ code, text })) })
export const card = (id: string, deck: string, topic: string, spec: string, front: string, back: string, o: Opt = {}): CardItem =>
  ({ ...base(id, topic, spec, 1, front, back, { memo: 'memorise', ...o }), type: 'card', deck })

export type AnyItem = Item

// ---------- formatting ----------
/** signed term: " + 3" or " - 3" */
export const sg = (n: number, body = ''): string => {
  const a = Math.abs(n)
  const c = body && a === 1 ? '' : fmt(a)
  return `${n < 0 ? '-' : '+'} ${c}${body}`
}
export const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : String(+n.toFixed(6)))
/** leading coefficient: 1 -> "", -1 -> "-" */
export const co = (n: number, body: string): string => (n === 1 ? body : n === -1 ? `-${body}` : `${fmt(n)}${body}`)

/** Polynomial in LaTeX, coefficients highest power first. */
export function polyTex(cs: number[], v = 'x'): string {
  const n = cs.length - 1
  let out = ''
  cs.forEach((c, i) => {
    if (c === 0) return
    const p = n - i
    const body = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`
    if (out === '') out = body ? co(c, body) : fmt(c)
    else out += ` ${sg(c, body)}`
  })
  return out || '0'
}
/** Polynomial as a SymPy string. */
export function polyPy(cs: number[], v = 'x'): string {
  const n = cs.length - 1
  return '(' + cs.map((c, i) => `(${c})*${v}**${n - i}`).join('+') + ')'
}
/** Reduced fraction in LaTeX. */
export function fr(n: number, d: number): string {
  if (d < 0) { n = -n; d = -d }
  const g = gcd(n, d) || 1
  n /= g; d /= g
  if (d === 1) return String(n)
  return `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}`
}
export const R = (n: number, d: number): string => `Rational(${n},${d})`
/** number with n significant figures, for worked solutions */
export { fmtSf } from '../lib/check'
