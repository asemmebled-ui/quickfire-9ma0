import type { Generator, Item, ItemType, Source, Weakness } from '../lib/types'
import { PURE_GENERATORS } from './gen-pure'
import { APPLIED_GENERATORS } from './gen-applied'
import { PURE1_ITEMS } from './items-pure1'
import { PURE2_ITEMS } from './items-pure2'
import { STATS_ITEMS } from './items-stats'
import { MECH_ITEMS } from './items-mech'
import { DECK_CARDS } from './decks'

export const GENERATORS: Generator[] = [...PURE_GENERATORS, ...APPLIED_GENERATORS]
export const STATIC_ITEMS: Item[] = [...PURE1_ITEMS, ...PURE2_ITEMS, ...STATS_ITEMS, ...MECH_ITEMS, ...DECK_CARDS]

/** One schedulable card: a static item, or a generator (a skill that makes a fresh question each time). */
export interface Entry {
  id: string; topic: string; spec: string[]; diff: number; type: ItemType | 'gen'; source: Source
  weak?: Weakness; deck?: string; name: string; isGen: boolean
}

const GEN: Record<string, Generator> = Object.fromEntries(GENERATORS.map((g) => [g.id, g]))
const STATIC: Record<string, Item> = Object.fromEntries(STATIC_ITEMS.map((i) => [i.id, i]))

export const BANK: Entry[] = [
  ...STATIC_ITEMS.map((i): Entry => ({ id: i.id, topic: i.topic, spec: i.spec, diff: i.diff, type: i.type, source: i.source, weak: i.weak, deck: i.deck, name: i.stem.slice(0, 60), isGen: false })),
  ...GENERATORS.map((g): Entry => ({ id: g.id, topic: g.topic, spec: g.spec, diff: g.diff, type: 'gen', source: g.source ?? 'original', weak: g.weak, name: g.name, isGen: true })),
]
export const ENTRY: Record<string, Entry> = Object.fromEntries(BANK.map((e) => [e.id, e]))

export const BANK_SIZE: Record<string, number> = {}
for (const e of BANK) BANK_SIZE[e.topic] = (BANK_SIZE[e.topic] ?? 0) + 1

/** Build the concrete question for a card. Generators use the seed; static items ignore it. */
export function instantiate(cardId: string, seed: number): Item | null {
  if (GEN[cardId]) return GEN[cardId].make(seed)
  return STATIC[cardId] ?? null
}

export const DECKS: { id: string; name: string; blurb: string }[] = [
  { id: 'trig-exact', name: 'Exact trig values', blurb: 'sin, cos, tan of the standard angles in degrees and radians' },
  { id: 'not-in-booklet', name: 'Formulae NOT in the booklet', blurb: 'Everything you must know by heart, checked against the official booklet' },
  { id: 'calculus', name: 'Standard derivatives and integrals', blurb: 'The ones the booklet leaves out' },
  { id: 'command', name: 'Command words and definitions', blurb: 'Show that, hence, exact, prove: what the examiner expects' },
  { id: 'mech-model', name: 'Mechanics modelling assumptions', blurb: 'Particle, light, smooth, inextensible: what each one lets you assume' },
  { id: 'hyp-wording', name: 'Hypothesis test wording', blurb: 'Hypotheses, conclusions and the phrases that earn the marks' },
  { id: 'lds', name: 'Large Data Set', blurb: 'Stations, variables, units and quirks of the weather data' },
  { id: 'calc', name: 'Calculator skills (fx-991CW / fx-CG100)', blurb: 'Key sequences for checking answers. Checking only: "show that" still needs full working' },
]
