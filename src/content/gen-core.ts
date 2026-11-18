import type { Generator, Item, Source, Weakness } from '../lib/types'
import { Rng } from '../lib/rng'
import { num, mcq, expr, type Opt } from './build'

type D = 1 | 2 | 3 | 4 | 5
export interface Q {
  num: (stem: string, value: number, sol: string, o?: Opt) => Item
  mcq: (stem: string, options: string[], sol: string, o?: Opt) => Item
  expr: (stem: string, latex: string, sol: string, o?: Opt) => Item
}
export const L = String.raw

/**
 * Meaning-preserving tidy-up of generated LaTeX: x^{1} -> x, 1x -> x, -1x -> -x, (1x) -> (x).
 * A "1" is only removed when it is a whole coefficient directly in front of a letter or a command like \mathbf.
 */
export function tidy(s: string): string {
  return s
    .replace(/(?<=[a-zA-Z)])\^\{1\}(?![\d])/g, '')
    .replace(/(?<![\d.a-zA-Z\\{^_])1(?=[a-zA-Z]|\\(?:mathbf|sin|cos|tan|sec|cot|csc|ln|log|sqrt|pi|theta|operatorname)(?![a-zA-Z]))/g, '')
}
function tidyItem<T extends Item>(it: T): T {
  const o = { ...it, stem: tidy(it.stem), solution: tidy(it.solution), err: it.err && tidy(it.err) } as T
  if (o.type === 'mcq' || o.type === 'method') (o as { options: string[] }).options = o.options.map(tidy)
  if (o.type === 'expr') (o as { latex: string }).latex = tidy(o.latex)
  return o
}

/** Register a parameterised generator. Its card id is `gen:<id>`; every review draws a fresh seed. */
export function makeRegistry() {
  const list: Generator[] = []
  const g = (id: string, topic: string, spec: string, diff: D, name: string, make: (r: Rng, q: Q) => Item, x: { weak?: Weakness; src?: Source } = {}) => {
    const cid = `gen:${id}`
    const add = (o: Opt = {}): Opt => ({ weak: x.weak, src: x.src, ...o })
    const q: Q = {
      num: (stem, value, sol, o) => num(cid, topic, spec, diff, stem, value, sol, add(o)),
      mcq: (stem, options, sol, o) => mcq(cid, topic, spec, diff, stem, options, sol, add(o)),
      expr: (stem, latex, sol, o) => expr(cid, topic, spec, diff, stem, latex, sol, add(o)),
    }
    list.push({ id: cid, topic, spec: spec.split(','), diff, name, weak: x.weak, source: x.src, make: (seed) => tidyItem(make(new Rng(seed), q)) })
  }
  return { list, g }
}
