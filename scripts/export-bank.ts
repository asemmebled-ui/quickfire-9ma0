/**
 * Exports every question (static items + N seeded instances of every generator) with the app's own
 * answer, so verify/verify.py can recompute each answer independently with SymPy/mpmath.
 * Also runs structural self-checks and fails loudly on any problem.
 */
import { writeFileSync } from 'node:fs'
import { GENERATORS, STATIC_ITEMS } from '../src/content/index'
import { parse, evalConst } from '../src/lib/mathparse'
import { checkExpr, checkNumeric, samplePoints, fmtSf } from '../src/lib/check'
import type { Item, McqItem } from '../src/lib/types'

export const SEEDS_PER_GENERATOR = 25
const problems: string[] = []
const records: unknown[] = []

function record(item: Item, seed: number | null) {
  const tag = seed === null ? item.id : `${item.id}#${seed}`
  const bad = (m: string) => problems.push(`${tag}: ${m}`)
  if (!item.stem || !item.solution) bad('missing stem or solution')
  const rec: Record<string, unknown> = { id: item.id, seed, type: item.type, v: item.v ?? null }
  try {
    if (item.type === 'numeric') {
      if (!Number.isFinite(item.value)) bad('answer is not a finite number')
      rec.js = item.value
      // the checker must accept the app's own displayed answer
      const shown = item.exact ? String(item.value) : item.tol !== undefined ? String(item.value) : fmtSf(item.value, item.sf ?? 3)
      if (!checkNumeric(shown, item).ok) bad(`checker rejects its own answer ${shown}`)
      if (!item.v) bad('numeric item without a verification spec')
    } else if (item.type === 'expr') {
      const pts = samplePoints(item.vars, 7, item.range)
      const f = parse(item.latex)
      rec.points = pts
      rec.js = pts.map((p) => f.fn(p))
      rec.addC = !!item.addC
      rec.vars = item.vars
      if (!checkExpr(item.latex + (item.addC ? ' + C' : ''), item).ok) bad('checker rejects its own answer')
      if (item.addC && checkExpr(item.latex, item).ok) bad('missing +C was accepted')
      if (!item.v) bad('expression item without a verification spec')
    } else if (item.type === 'mcq' || item.type === 'method') {
      const opts = (item as McqItem).options
      if (opts.length < 3) bad('fewer than 3 options')
      if (new Set(opts.map((o) => o.replace(/\s/g, ''))).size !== opts.length) bad('duplicate options: ' + JSON.stringify(opts))
      if (item.v) {
        if (item.v.val !== undefined) rec.js = item.v.val
        else {
          const val = evalConst(opts[0])
          if (!Number.isFinite(val)) bad('correct option is not parseable maths; give v.val')
          rec.js = val
        }
      }
    } else if (item.v) {
      if (item.v.val === undefined) bad('self/card item with v needs v.val')
      rec.js = item.v.val
    }
  } catch (e) { bad((e as Error).message) }
  records.push(rec)
}

const ids = new Set<string>()
for (const it of STATIC_ITEMS) { if (ids.has(it.id)) problems.push(`duplicate id ${it.id}`); ids.add(it.id); record(it, null) }
for (const g of GENERATORS) {
  if (ids.has(g.id)) problems.push(`duplicate id ${g.id}`); ids.add(g.id)
  for (let s = 1; s <= SEEDS_PER_GENERATOR; s++) {
    try { record(g.make(s), s) } catch (e) { problems.push(`${g.id}#${s}: generator threw ${(e as Error).message}`) }
  }
}

writeFileSync('verify/bank-export.json', JSON.stringify(records))
console.log(`Exported ${records.length} question instances (${STATIC_ITEMS.length} static, ${GENERATORS.length} generators x ${SEEDS_PER_GENERATOR} seeds).`)
if (problems.length) {
  console.error(`\n${problems.length} structural problem(s):`)
  for (const p of problems.slice(0, 60)) console.error('  ' + p)
  process.exit(1)
}
console.log('Structural self-checks passed.')
