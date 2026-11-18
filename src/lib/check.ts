import { parse, evalConst } from './mathparse'
import { Rng } from './rng'
import type { ExprItem, NumericItem } from './types'

export interface CheckResult { ok: boolean; msg?: string; value?: number }

/** Round to n significant figures. */
export function sigRound(x: number, sf: number): number {
  if (x === 0 || !Number.isFinite(x)) return x
  const mag = Math.floor(Math.log10(Math.abs(x)))
  const f = Math.pow(10, sf - 1 - mag)
  // nudge by a relative epsilon so 2.675 -> 2.68 despite binary representation
  return Math.round(x * f * (1 + 1e-12)) / f
}

/** Format a value to n significant figures for display (keeps trailing zeros, e.g. 2.50). */
export function fmtSf(x: number, sf = 3): string {
  if (x === 0) return '0'
  const r = sigRound(x, sf)
  const mag = Math.floor(Math.log10(Math.abs(r)))
  const dp = Math.max(0, sf - 1 - mag)
  return r.toFixed(dp)
}

const close = (a: number, b: number, rel = 1e-9) => Math.abs(a - b) <= rel * Math.max(1, Math.abs(b))

export function parseNumber(raw: string, unit?: string): number {
  let s = raw.trim().replace(/−|–/g, '-').replace(/,/g, '')
  if (unit) {
    const u = unit.replace(/\\|\$|\{|\}|\^|\s/g, '')
    const bare = s.replace(/\s/g, '')
    if (u && bare.toLowerCase().endsWith(u.toLowerCase())) s = bare.slice(0, bare.length - u.length)
  }
  s = s.replace(/°|%/g, '').trim()
  if (s === '') return NaN
  if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return Number(s)
  return evalConst(s)
}

/**
 * Numeric answers follow Edexcel "awrt" marking: an answer is right if it rounds to the stated
 * significant figures (default 3). More accurate answers are accepted, less accurate ones are not.
 */
export function checkNumeric(raw: string, item: Pick<NumericItem, 'value' | 'sf' | 'exact' | 'unit' | 'tol'>): CheckResult {
  const u = parseNumber(raw, item.unit)
  if (!Number.isFinite(u)) return { ok: false, msg: 'Could not read that as a number.' }
  const v = item.value
  if (close(u, v)) return { ok: true, value: u }
  if (item.exact) return { ok: false, value: u }
  if (item.tol !== undefined) return { ok: Math.abs(u - v) <= item.tol + 1e-12, value: u }
  const sf = item.sf ?? 3
  if (close(sigRound(u, sf), sigRound(v, sf))) return { ok: true, value: u }
  if (sf > 1 && close(sigRound(u, sf - 1), sigRound(v, sf - 1)) && close(u, sigRound(u, sf - 1)))
    return { ok: false, value: u, msg: `Right method, but not accurate enough: give ${sf} significant figures.` }
  return { ok: false, value: u }
}

/** Sample points used for expression equivalence. Fixed seed so marking is reproducible. */
export function samplePoints(vars: string[], n = 7, range: [number, number] = [0.35, 1.9], seed = 20270526): Record<string, number>[] {
  const r = new Rng(seed)
  return Array.from({ length: n }, () => Object.fromEntries(vars.map((v) => [v, r.float(range[0], range[1])])))
}

/**
 * Expression equivalence by numeric evaluation at several random points (never string matching).
 * For indefinite integrals (`addC`) the student's answer must differ from ours by a constant and
 * must include an arbitrary constant.
 */
export function checkExpr(raw: string, item: Pick<ExprItem, 'latex' | 'vars' | 'addC' | 'range'>): CheckResult {
  let user, ref
  try { ref = parse(item.latex) } catch (e) { throw new Error(`bad stored answer ${item.latex}: ${(e as Error).message}`) }
  const cleaned = raw.replace(/^\s*[a-zA-Z]\s*=\s*(?!=)/, '').replace(/^\s*(f|g)\s*'*\s*\(\s*x\s*\)\s*=/, '').replace(/^\s*\\frac\{d[a-z]\}\{d[a-z]\}\s*=/, '')
  try { user = parse(cleaned) } catch { return { ok: false, msg: 'Could not read that expression.' } }
  const extra = [...user.vars].filter((v) => !item.vars.includes(v))
  if (item.addC) {
    if (extra.length === 0) return { ok: false, msg: 'Missing the constant of integration (+ C). That loses the final A mark.' }
    if (extra.length > 1) return { ok: false, msg: 'Unexpected letters in your answer.' }
  } else if (extra.length) return { ok: false, msg: `Unexpected letter “${extra[0]}” in your answer.` }
  const pts = samplePoints(item.vars, 7, item.range)
  let valid = 0
  let diff0: number | null = null
  for (const pt of pts) {
    const env = { ...pt }
    for (const c of extra) env[c] = 0.7310585
    const a = user.fn(env), b = ref.fn(pt)
    if (!Number.isFinite(b)) continue
    if (!Number.isFinite(a)) return { ok: false }
    valid++
    if (item.addC) {
      const d = a - b
      if (diff0 === null) diff0 = d
      else if (Math.abs(d - diff0) > 1e-6 * Math.max(1, Math.abs(b))) return { ok: false }
    } else if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) return { ok: false }
  }
  if (valid < 3) throw new Error('not enough valid sample points for ' + item.latex)
  return { ok: true }
}
