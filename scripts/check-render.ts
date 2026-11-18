/** Renders every LaTeX string and every diagram in the bank (all static items + 25 seeds of each generator). Fails on any error. */
import { GENERATORS, STATIC_ITEMS } from '../src/content/index'
import { renderTex, looksLikeRawMaths } from '../src/lib/tex'
import { renderDiagram } from '../src/lib/diagrams'
import type { Item } from '../src/lib/types'

let strings = 0, diagrams = 0
const errors: string[] = []
const check = (tag: string, s: string | undefined) => {
  if (!s) return
  strings++
  try { renderTex(s, true) } catch (e) { errors.push(`${tag}: KaTeX error: ${(e as Error).message.slice(0, 140)}`) }
  if (looksLikeRawMaths(s)) errors.push(`${tag}: maths outside $...$: ${s.slice(0, 80)}`)
  // cosmetic artefacts from generators: x^{1}, x^{0}, "+ -", "- -", a leading coefficient of 1 before a letter
  // (integral limits like ]_{0}^{1} are fine; only powers of a letter or bracket are flagged)
  const m = s.match(/(?<=[a-zA-Z)])\^\{[01]\}|[+-] [+-] |(?<![\d.a-zA-Z\\{])1[a-z](?![a-z])|undefined(?=[\^_{}$\\\d(])|(?<=[\^_{}$\\\d(])undefined|NaN/)
  if (m) errors.push(`${tag}: formatting artefact "${m[0]}" in: ${s.slice(Math.max(0, (m.index ?? 0) - 30), (m.index ?? 0) + 30)}`)
}
function item(it: Item, tag: string) {
  check(tag + ' stem', it.stem); check(tag + ' solution', it.solution); check(tag + ' err', it.err)
  if (it.type === 'mcq' || it.type === 'method') it.options.forEach((o, i) => check(`${tag} option${i}`, o))
  if (it.type === 'self') it.marks.forEach((m, i) => check(`${tag} mark${i}`, m.text))
  if (it.type === 'expr') check(tag + ' answer', `$${it.latex}$`)
  if (it.diagram) {
    diagrams++
    try { const svg = renderDiagram(it.diagram); if (!svg.startsWith('<svg') || svg.length < 200) errors.push(`${tag}: empty diagram`) }
    catch (e) { errors.push(`${tag}: diagram error ${(e as Error).message}`) }
  }
}
for (const it of STATIC_ITEMS) item(it, it.id)
for (const g of GENERATORS) for (let s = 1; s <= 25; s++) item(g.make(s), `${g.id}#${s}`)

console.log(`Rendered ${strings} LaTeX strings and ${diagrams} diagrams.`)
if (errors.length) { console.error(`${errors.length} rendering problem(s):`); errors.slice(0, 60).forEach((e) => console.error('  ' + e)); process.exit(1) }
console.log('ALL LATEX AND DIAGRAMS RENDER WITHOUT ERRORS')
