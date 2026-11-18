import { describe, expect, it } from 'vitest'
import { checkExpr, checkNumeric, sigRound, fmtSf, parseNumber } from '../src/lib/check'
import { parse, evalConst } from '../src/lib/mathparse'

const num = (value: number, extra: Record<string, unknown> = {}) => ({ value, ...extra })

describe('numeric answers (Edexcel awrt rules)', () => {
  it('accepts the value rounded to 3 s.f. and more accurate answers', () => {
    expect(checkNumeric('0.805', num(0.8047189562)).ok).toBe(true)
    expect(checkNumeric('0.80472', num(0.8047189562)).ok).toBe(true)
    expect(checkNumeric('0.8047189562', num(0.8047189562)).ok).toBe(true)
  })
  it('rejects answers given to fewer s.f. with a helpful message', () => {
    const r = checkNumeric('0.80', num(0.8047189562))
    expect(r.ok).toBe(false)
    expect(r.msg).toMatch(/significant figures/)
  })
  it('rejects wrong rounding at the boundary', () => {
    expect(checkNumeric('0.804', num(0.8047189562)).ok).toBe(false)
    expect(checkNumeric('2.68', num(2.675)).ok).toBe(true) // rounds half up
    expect(checkNumeric('2.67', num(2.675)).ok).toBe(false)
  })
  it('respects a stated number of s.f. (2 s.f. for g = 9.8)', () => {
    expect(checkNumeric('47', num(47.04, { sf: 2 })).ok).toBe(true)
    expect(checkNumeric('47.0', num(47.04, { sf: 2 })).ok).toBe(true)
    expect(checkNumeric('46', num(47.04, { sf: 2 })).ok).toBe(false)
  })
  it('handles exact answers: fractions and surd/LaTeX forms are equivalent, decimals of irrationals are not', () => {
    expect(checkNumeric('5/14', num(5 / 14, { exact: true })).ok).toBe(true)
    expect(checkNumeric('\\frac{5}{14}', num(5 / 14, { exact: true })).ok).toBe(true)
    expect(checkNumeric('0.357', num(5 / 14, { exact: true })).ok).toBe(false)
    expect(checkNumeric('-0.75', num(-0.75, { exact: true })).ok).toBe(true)
    expect(checkNumeric('-3/4', num(-0.75, { exact: true })).ok).toBe(true)
  })
  it('handles absolute tolerances (angles to 1 d.p.) at the edges', () => {
    const it_ = num(78.46304, { tol: 0.05 })
    expect(checkNumeric('78.5', it_).ok).toBe(true)
    expect(checkNumeric('78.4', it_).ok).toBe(false)
    expect(checkNumeric('78.46', it_).ok).toBe(true)
  })
  it('strips units and handles minus signs and commas', () => {
    expect(parseNumber('12 cm', 'cm')).toBe(12)
    expect(parseNumber('−3')).toBe(-3)
    expect(parseNumber('229,278')).toBe(229278)
    expect(checkNumeric('19.6N', num(19.6, { unit: 'N' })).ok).toBe(true)
  })
  it('rejects junk', () => {
    expect(checkNumeric('abc', num(1)).ok).toBe(false)
    expect(checkNumeric('', num(1)).ok).toBe(false)
  })
  it('formats to s.f. keeping trailing zeros', () => {
    expect(fmtSf(2.5, 3)).toBe('2.50')
    expect(fmtSf(0.031676, 3)).toBe('0.0317')
    expect(fmtSf(229277.6, 3)).toBe('229000')
    expect(sigRound(1234.5, 2)).toBe(1200)
  })
})

describe('expression answers (numeric equivalence, never string matching)', () => {
  const e = (latex: string, extra: Record<string, unknown> = {}) => ({ latex, vars: ['x'], ...extra })
  it('accepts algebraically equivalent forms', () => {
    const ref = e('12x^{3} - \\frac{3}{x^{2}}')
    for (const ans of ['12x^3 - 3/x^2', '12x^{3}-3x^{-2}', '\\frac{12x^5-3}{x^2}', '3(4x^3 - x^{-2})', '12\\cdot x^3-\\frac{3}{x\\cdot x}']) expect(checkExpr(ans, ref).ok, ans).toBe(true)
  })
  it('accepts trig, exp and log equivalents', () => {
    expect(checkExpr('2\\sin x\\cos x', e('\\sin 2x')).ok).toBe(true)
    expect(checkExpr('\\sin\\left(2x\\right)', e('2\\sin x\\cos x')).ok).toBe(true)
    expect(checkExpr('e^{2x}\\cdot 3', e('3e^{2x}')).ok).toBe(true)
    expect(checkExpr('\\ln(x^2)', e('2\\ln x')).ok).toBe(true)
    expect(checkExpr('\\frac{1}{2}\\sin^{2}x', e('\\frac{1-\\cos 2x}{4}')).ok).toBe(true)
  })
  it('rejects common wrong answers', () => {
    expect(checkExpr('12x^3 + 3/x^2', e('12x^{3} - \\frac{3}{x^{2}}')).ok).toBe(false)
    expect(checkExpr('-2\\sin 2x', e('-6\\sin 3x')).ok).toBe(false)
    expect(checkExpr('\\cos 2x', e('2\\cos 2x')).ok).toBe(false)
    expect(checkExpr('x^2', e('x^3')).ok).toBe(false)
  })
  it('requires +C on indefinite integrals and accepts any constant name', () => {
    const ref = e('\\frac{1}{3}e^{3x}', { addC: true })
    expect(checkExpr('\\frac{1}{3}e^{3x}', ref).ok).toBe(false)
    expect(checkExpr('\\frac{1}{3}e^{3x}', ref).msg).toMatch(/constant of integration/)
    expect(checkExpr('\\frac{e^{3x}}{3} + C', ref).ok).toBe(true)
    expect(checkExpr('\\frac{e^{3x}}{3} + k', ref).ok).toBe(true)
    expect(checkExpr('\\frac{e^{3x}}{3} + 5 + c', ref).ok).toBe(true)
    expect(checkExpr('3e^{3x} + C', ref).ok).toBe(false)
  })
  it('accepts a leading "y =" or "dy/dx ="', () => {
    expect(checkExpr('y = 2x', e('2x')).ok).toBe(true)
    expect(checkExpr('\\frac{dy}{dx} = 2x', e('2x')).ok).toBe(true)
  })
  it('rejects unexpected variables and unparseable input', () => {
    expect(checkExpr('2t', e('2x')).ok).toBe(false)
    expect(checkExpr('2x +', e('2x')).ok).toBe(false)
  })
})

describe('parser', () => {
  it('evaluates constants', () => {
    expect(evalConst('\\frac{\\sqrt3}{2}')).toBeCloseTo(Math.sqrt(3) / 2, 12)
    expect(evalConst('2^{-3}')).toBeCloseTo(0.125)
    expect(evalConst('\\log_{2} 8')).toBeCloseTo(3)
    expect(evalConst('\\sin^{-1}(0.5)')).toBeCloseTo(Math.PI / 6)
    expect(evalConst('(-8)^{1/3}')).toBeCloseTo(-2)
    expect(evalConst('|{-4}|')).toBe(4)
  })
  it('handles implicit multiplication and function powers', () => {
    const f = parse('3x\\sin^2 x').fn
    expect(f({ x: 0.7 })).toBeCloseTo(3 * 0.7 * Math.sin(0.7) ** 2, 12)
    expect(parse('2\\pi r').fn({ r: 2 })).toBeCloseTo(4 * Math.PI)
  })
})

import { tidy } from '../src/content/gen-core'
describe('generated LaTeX tidy-up is meaning-preserving', () => {
  it('removes unit coefficients and first powers only', () => {
    expect(tidy('2x^{1}\ln x + x^{1}')).toBe('2x\ln x + x')
    expect(tidy('(-1x)^{2}')).toBe('(-x)^{2}')
    expect(tidy('$1x^{-2}$')).toBe('$x^{-2}$')
    expect(tidy('1\mathbf{i}')).toBe('\mathbf{i}')
    for (const keep of ['21x', '0.1x', '\frac1x', 'x^{12}', '\int_{0}^{1}', 'x + 1', '4x + 1\right|', '1 \times 2', '10x', '\frac{1}{x}']) expect(tidy(keep)).toBe(keep)
  })
})
