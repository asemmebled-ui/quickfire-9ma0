/**
 * Parser + numeric evaluator for the subset of LaTeX / ASCII maths a student types
 * (MathLive output or plain text such as `3x^2 sin(2x)`).
 * It is used to decide whether two expressions are equivalent by evaluating both at random points.
 */
export type Env = Record<string, number>
export type Fn = (env: Env) => number
export interface Parsed { fn: Fn; vars: Set<string> }

type Tok = { t: 'num'; v: number } | { t: 'var'; v: string } | { t: 'fn'; v: string } | { t: 'op'; v: string }

const FUNCS = ['arcsin', 'arccos', 'arctan', 'asin', 'acos', 'atan', 'cosec', 'sqrt', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'exp', 'log', 'ln']
const GREEK: Record<string, string> = { theta: 'θ', alpha: 'α', beta: 'β', lambda: 'λ', mu: 'μ', phi: 'φ', omega: 'ω' }

function prep(src: string): string {
  return src
    .replace(/\$/g, '')
    .replace(/\\left|\\right|\\displaystyle|\\,|\\!|\\;|\\:|\\ /g, ' ')
    .replace(/\\[dt]frac/g, '\\frac')
    .replace(/\\cdot|\\times|×|·/g, '*')
    .replace(/\\div|÷/g, '/')
    .replace(/\\exponentialE|\\mathrm\{e\}|\\mathrm e/g, ' e ')
    .replace(/\\operatorname\{([a-z]+)\}/g, '\\$1 ')
    .replace(/\\mathrm\{([a-zA-Z]+)\}/g, '$1')
    .replace(/\\[lr]?vert|\\mid/g, '|')
    .replace(/\\lbrace|\\rbrace/g, '')
    .replace(/−|–/g, '-')
    .replace(/π/g, '\\pi ')
    .replace(/θ/g, '\\theta ')
    .replace(/\*\*/g, '^')
}

function lex(src: string): Tok[] {
  const s = prep(src)
  const out: Tok[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (/\s/.test(c)) { i++; continue }
    if (/[0-9.]/.test(c)) {
      let j = i
      while (j < s.length && /[0-9.]/.test(s[j])) j++
      const v = Number(s.slice(i, j))
      if (Number.isNaN(v)) throw new Error('bad number')
      out.push({ t: 'num', v }); i = j; continue
    }
    if (c === '\\') {
      let j = i + 1
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++
      const name = s.slice(i + 1, j)
      i = j
      if (name === 'frac' || name === 'sqrt') out.push({ t: 'fn', v: name })
      else if (name === 'pi') out.push({ t: 'var', v: 'π' })
      else if (GREEK[name]) out.push({ t: 'var', v: GREEK[name] })
      else if (FUNCS.includes(name)) out.push({ t: 'fn', v: name })
      else if (name === '') throw new Error('stray backslash')
      else throw new Error('unknown command \\' + name)
      continue
    }
    if (/[a-zA-Z]/.test(c)) {
      const rest = s.slice(i)
      if (/^pi(?![a-zA-Z])/.test(rest)) { out.push({ t: 'var', v: 'π' }); i += 2; continue }
      const f = FUNCS.find((n) => rest.startsWith(n))
      if (f) { out.push({ t: 'fn', v: f }); i += f.length; continue }
      out.push({ t: 'var', v: c }); i++; continue
    }
    if ('+-*/^(){}[]|_'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue }
    throw new Error('unexpected character ' + c)
  }
  return out
}

const sec = (x: number) => 1 / Math.cos(x)
const APPLY: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, sec, csc: (x) => 1 / Math.sin(x), cosec: (x) => 1 / Math.sin(x),
  cot: (x) => Math.cos(x) / Math.sin(x), ln: (x) => (x > 0 ? Math.log(x) : NaN), exp: Math.exp,
  log: (x) => (x > 0 ? Math.log10(x) : NaN), arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
}
const INVERSE: Record<string, string> = { sin: 'arcsin', cos: 'arccos', tan: 'arctan' }

function pow(a: number, b: number): number {
  if (a < 0 && !Number.isInteger(b)) {
    // real odd roots of negatives, e.g. (-8)^(1/3)
    const q = Math.round(1 / b)
    if (Math.abs(1 / b - q) < 1e-12 && Math.abs(q) % 2 === 1) return -Math.pow(-a, b)
    return NaN
  }
  return Math.pow(a, b)
}

export function parse(src: string): Parsed {
  const toks = lex(src)
  const vars = new Set<string>()
  let p = 0
  let absDepth = 0
  const peek = () => toks[p]
  const isOp = (v: string) => peek()?.t === 'op' && peek().v === v
  const eat = (v: string) => { if (!isOp(v)) throw new Error(`expected ${v}`); p++ }

  function startsFactor(noParen = false, noFn = false): boolean {
    const t = peek()
    if (!t) return false
    if (t.t === 'num' || t.t === 'var') return true
    if (t.t === 'fn') return !noFn || t.v === 'frac' || t.v === 'sqrt'
    if (t.v === '(') return !noParen
    if (t.v === '{') return true
    if (t.v === '|') return absDepth === 0 && !noParen
    return false
  }

  function expr(): Fn {
    let left = term()
    while (isOp('+') || isOp('-')) {
      const op = toks[p++].v
      const right = term()
      const l = left
      left = op === '+' ? (e) => l(e) + right(e) : (e) => l(e) - right(e)
    }
    return left
  }

  function term(): Fn {
    let left = unary()
    for (;;) {
      if (isOp('*')) { p++; const r = unary(); const l = left; left = (e) => l(e) * r(e) }
      else if (isOp('/')) { p++; const r = unary(); const l = left; left = (e) => l(e) / r(e) }
      else if (startsFactor()) { const r = power(); const l = left; left = (e) => l(e) * r(e) }
      else return left
    }
  }

  function unary(): Fn {
    if (isOp('-')) { p++; const u = unary(); return (e) => -u(e) }
    if (isOp('+')) { p++; return unary() }
    return power()
  }

  function exponent(): Fn {
    if (isOp('{')) { p++; const x = expr(); eat('}'); return x }
    if (isOp('-')) { p++; const x = exponent(); return (e) => -x(e) }
    if (isOp('(')) { p++; const x = expr(); eat(')'); return x }
    return atom()
  }

  function power(): Fn {
    const base = atom()
    if (isOp('^')) { p++; const ex = exponent(); return (e) => pow(base(e), ex(e)) }
    return base
  }

  function group(): Fn {
    if (isOp('{')) { p++; const x = expr(); eat('}'); return x }
    return atom()
  }

  /** argument of a function written without brackets: sin 2x, ln x^2, cos \frac{x}{2} */
  function bareArg(): Fn {
    let neg = false
    if (isOp('-')) { p++; neg = true }
    if (!startsFactor(true, true)) throw new Error('missing function argument')
    let left = power()
    while (startsFactor(true, true)) { const r = power(); const l = left; left = (e) => l(e) * r(e) }
    return neg ? (e) => -left(e) : left
  }

  function atom(): Fn {
    const t = toks[p++]
    if (!t) throw new Error('unexpected end')
    if (t.t === 'num') { const v = t.v; return () => v }
    if (t.t === 'var') {
      if (t.v === 'π') return () => Math.PI
      if (t.v === 'e') return () => Math.E
      const name = t.v
      vars.add(name)
      return (e) => (name in e ? e[name] : NaN)
    }
    if (t.t === 'op') {
      if (t.v === '(') { const x = expr(); eat(')'); return x }
      if (t.v === '{') { const x = expr(); eat('}'); return x }
      if (t.v === '[') { const x = expr(); eat(']'); return x }
      if (t.v === '|') { absDepth++; const x = expr(); eat('|'); absDepth--; return (e) => Math.abs(x(e)) }
      throw new Error('unexpected ' + t.v)
    }
    // functions
    if (t.v === 'frac') { const a = group(); const b = group(); return (e) => a(e) / b(e) }
    if (t.v === 'sqrt') {
      if (isOp('[')) { p++; const n = expr(); eat(']'); const x = group(); return (e) => pow(x(e), 1 / n(e)) }
      const x = isOp('(') ? atom() : group()
      return (e) => (x(e) >= 0 ? Math.sqrt(x(e)) : NaN)
    }
    let name = t.v
    let base: Fn | null = null
    if (name === 'log' && isOp('_')) { p++; base = group() }
    let ex: Fn | null = null
    if (isOp('^')) {
      p++
      // sin^{-1} x means arcsin x
      const save = p
      let isInv = false
      if (isOp('{')) { p++; if (isOp('-')) { p++; const n = peek(); if (n?.t === 'num' && n.v === 1) { p++; if (isOp('}')) { p++; isInv = true } } } }
      if (isInv && INVERSE[name]) name = INVERSE[name]
      else { p = save; ex = exponent() }
    }
    const arg = isOp('(') || isOp('{') || isOp('|') ? atom() : bareArg()
    const f = APPLY[name]
    let res: Fn = base ? (e) => Math.log(arg(e)) / Math.log(base!(e)) : (e) => f(arg(e))
    if (ex) { const r = res; const x = ex; res = (e) => pow(r(e), x(e)) }
    return res
  }

  const fn = expr()
  if (p < toks.length) throw new Error('unexpected ' + JSON.stringify(toks[p].v))
  return { fn, vars }
}

/** Evaluate a constant expression such as `\frac{\sqrt3}{2}` or `3/4`. Returns NaN if it is not a constant. */
export function evalConst(src: string): number {
  try {
    const { fn, vars } = parse(src)
    if (vars.size) return NaN
    return fn({})
  } catch { return NaN }
}
