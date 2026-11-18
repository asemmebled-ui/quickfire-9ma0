/**
 * Second-pass review helper. Draws a reproducible random 10% sample of the quiz bank.
 *   npx tsx scripts/review-sample.ts            -> questions only (solve these independently first)
 *   npx tsx scripts/review-sample.ts --answers  -> the stored answers, to compare afterwards
 */
import { GENERATORS, STATIC_ITEMS } from '../src/content/index'
import { Rng } from '../src/lib/rng'
import { fmtSf } from '../src/lib/check'
import type { Item } from '../src/lib/types'

const r = new Rng(20261117)
const quiz = STATIC_ITEMS.filter((i) => i.type !== 'card')
const statics = r.shuffle(quiz).slice(0, Math.ceil(quiz.length / 10))
const gens = r.shuffle(GENERATORS).slice(0, Math.ceil(GENERATORS.length / 10)).map((g) => g.make(r.int(1, 10000)))
const show = process.argv.includes('--answers')
const ans = (it: Item) => it.type === 'numeric' ? (it.exact ? String(+it.value.toFixed(8)) : fmtSf(it.value, (it.sf ?? 3) + 1)) + (it.unit ? ' ' + it.unit : '')
  : it.type === 'expr' ? it.latex + (it.addC ? ' + C' : '') : it.type === 'mcq' || it.type === 'method' ? it.options[0] : it.type === 'self' ? it.solution : ''
;[...statics, ...gens].forEach((it, k) => {
  const opts = (it.type === 'mcq' || it.type === 'method') && !show ? '\n     options: ' + new Rng(k).shuffle(it.options).join('  |  ') : ''
  console.log(`${k + 1}. [${it.id}] ${show ? ans(it) : it.stem + opts}`)
})
