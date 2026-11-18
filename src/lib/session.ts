/** Builds practice sessions. Pure functions over the bank + stored state, so they are unit-testable. */
import type { Attempt, PaperLog, Weakness } from './types'
import type { StoredCard } from './db'
import { Rng } from './rng'
import { TOPIC, TOPIC_MARKS } from '../content/topics'
import type { Entry } from '../content/index'

export interface SessionInput {
  bank: Entry[]
  cards: StoredCard[]
  attempts: Attempt[]
  papers: PaperLog[]
  covered: string[]
  now: number
  seed: number
}
export interface Slot { id: string; why: 'review' | 'new' | 'weak' | 'focus' | 'exam' | 'deck' }

const isQuiz = (e: Entry) => e.type !== 'card'
export const eligible = (e: Entry, covered: Set<string>) => e.topic.startsWith('x.') || covered.has(e.topic)

/**
 * Interleave: reorder so that no two consecutive slots share a topic where avoidable
 * (Rohrer et al. 2020: mixing problem types makes you choose the method).
 */
export function interleave<T extends { id: string }>(xs: T[], topicOf: (x: T) => string, r: Rng): T[] {
  // Always take from the topic with the most items left (ties broken randomly), skipping the previous topic.
  // This avoids back-to-back repeats whenever that is possible at all.
  const groups = new Map<string, T[]>()
  for (const x of r.shuffle(xs)) groups.set(topicOf(x), [...(groups.get(topicOf(x)) ?? []), x])
  const out: T[] = []
  let last = ''
  while (out.length < xs.length) {
    const cands = [...groups.entries()].filter(([t, g]) => g.length && t !== last)
    const pickFrom = cands.length ? cands : [...groups.entries()].filter(([, g]) => g.length)
    const max = Math.max(...pickFrom.map(([, g]) => g.length))
    const [t, g] = r.pick(pickFrom.filter(([, g2]) => g2.length === max))
    out.push(g.shift()!)
    last = t
  }
  return out
}

/** Which tracked weakness is currently weakest (lowest recent accuracy; untested counts as weakest). */
export function weakestWeakness(bank: Entry[], attempts: Attempt[]): Weakness {
  const ids: Record<Weakness, Set<string>> = { const: new Set(), logdomain: new Set(), vecunits: new Set() }
  for (const e of bank) if (e.weak) ids[e.weak].add(e.id)
  let best: Weakness = 'const', bestAcc = Infinity
  for (const w of ['const', 'logdomain', 'vecunits'] as Weakness[]) {
    const recent = attempts.filter((a) => ids[w].has(a.cardId)).slice(-10)
    const acc = recent.length ? recent.reduce((s, a) => s + a.score, 0) / recent.length : -1
    if (acc < bestAcc) { bestAcc = acc; best = w }
  }
  return best
}

export const WEAKNESS_NAME: Record<Weakness, string> = {
  const: 'Dropping constant terms when substituting',
  logdomain: 'Rejecting valid negative solutions in log equations',
  vecunits: 'Unit mismatches in vector problems',
}

/** The "Today" plan: due reviews (FSRS), some new items from covered topics, one weakness drill. */
export function todayPlan(inp: SessionInput, reviews: number, newItems: number): Slot[] {
  const r = new Rng(inp.seed)
  const covered = new Set(inp.covered)
  const byId = new Map(inp.bank.map((e) => [e.id, e]))
  const due = inp.cards
    .filter((c) => c.seen > 0 && new Date(c.fsrs.due).getTime() <= inp.now && byId.has(c.id) && eligible(byId.get(c.id)!, covered))
    .sort((a, b) => new Date(a.fsrs.due).getTime() - new Date(b.fsrs.due).getTime())
    .slice(0, reviews)
  const seen = new Set(inp.cards.filter((c) => c.seen > 0).map((c) => c.id))
  // new items: easier first within each topic, spread across topics
  const fresh = r.shuffle(inp.bank.filter((e) => isQuiz(e) && !seen.has(e.id) && eligible(e, covered)))
    .sort((a, b) => a.diff - b.diff)
  const picked: Entry[] = [], usedTopics = new Map<string, number>()
  for (const e of fresh) {
    if (picked.length >= newItems) break
    if ((usedTopics.get(e.topic) ?? 0) >= 2) continue
    picked.push(e); usedTopics.set(e.topic, (usedTopics.get(e.topic) ?? 0) + 1)
  }
  const w = weakestWeakness(inp.bank, inp.attempts)
  const drills = inp.bank.filter((e) => e.weak === w && isQuiz(e) && eligible(e, covered))
  const drill = drills.length ? r.pick(drills.filter((d) => d.isGen).length ? drills.filter((d) => d.isGen) : drills) : null
  const slots: Slot[] = [
    ...due.map((c) => ({ id: c.id, why: 'review' as const })),
    ...picked.map((e) => ({ id: e.id, why: 'new' as const })),
  ]
  const mixed = interleave(slots, (s) => byId.get(s.id)?.topic ?? '', r)
  if (drill && !mixed.some((s) => s.id === drill.id)) mixed.splice(Math.min(3, mixed.length), 0, { id: drill.id, why: 'weak' })
  return mixed
}

/** Interleaved quick-fire across all covered topics: due first, then weakest topics, never cards. */
export function quickfire(inp: SessionInput, n: number, focusTopic?: string): Slot[] {
  const r = new Rng(inp.seed)
  const covered = new Set(inp.covered)
  const card = new Map(inp.cards.map((c) => [c.id, c]))
  const pool = inp.bank.filter((e) => isQuiz(e) && eligible(e, covered) && (!focusTopic || e.topic === focusTopic))
  // priority: due > unseen > not due (desirable difficulty: don't grind what is already known)
  const score = (e: Entry) => {
    const c = card.get(e.id)
    if (!c || c.seen === 0) return 1 + r.next()
    const overdue = (inp.now - new Date(c.fsrs.due).getTime()) / 86400000
    return overdue >= 0 ? 2 + Math.min(overdue, 10) / 10 : r.next() * 0.5
  }
  const top = pool.map((e) => ({ e, s: score(e) })).sort((a, b) => b.s - a.s).slice(0, n).map((x) => x.e)
  const slots = top.map((e) => ({ id: e.id, why: (focusTopic ? 'focus' : 'review') as Slot['why'] }))
  return focusTopic ? r.shuffle(slots) : interleave(slots, (s) => inp.bank.find((e) => e.id === s.id)!.topic, r)
}

/**
 * "Exam-style (original)" practice with coverage-gap weighting. Nobody can predict the paper; this leans towards
 * topics that carry many marks and that have appeared less in the papers you have logged (a proxy for "not recently seen").
 */
export function topicExamWeights(papers: PaperLog[], covered: string[]): Record<string, number> {
  const seenMarks: Record<string, number> = {}
  for (const p of papers) for (const q of p.questions) for (const t of q.topics) seenMarks[t] = (seenMarks[t] ?? 0) + q.max / q.topics.length
  const totalSeen = Object.values(seenMarks).reduce((s, x) => s + x, 0)
  const out: Record<string, number> = {}
  for (const id of covered) {
    if (!TOPIC[id]) continue
    const expected = TOPIC_MARKS[id] / 300
    const observed = totalSeen > 0 ? (seenMarks[id] ?? 0) / totalSeen : expected
    const gap = Math.max(0.5, Math.min(2, expected / Math.max(observed, expected / 4)))
    out[id] = TOPIC_MARKS[id] * gap
  }
  return out
}

export function examStyle(inp: SessionInput, n: number): Slot[] {
  const r = new Rng(inp.seed)
  const w = topicExamWeights(inp.papers, inp.covered)
  const pool = inp.bank.filter((e) => isQuiz(e) && w[e.topic] !== undefined && (e.type === 'self' || e.diff >= 3))
  const out: Slot[] = [], used = new Set<string>()
  const total = Object.values(w).reduce((s, x) => s + x, 0)
  for (let k = 0; k < n * 6 && out.length < n; k++) {
    let x = r.next() * total, topic = ''
    for (const [id, v] of Object.entries(w)) { x -= v; if (x <= 0) { topic = id; break } }
    const cands = pool.filter((e) => e.topic === topic && !used.has(e.id))
    if (!cands.length) continue
    const e = r.pick(cands); used.add(e.id); out.push({ id: e.id, why: 'exam' })
  }
  return out
}

/** Flashcard deck session: due cards of the deck first, then up to `n` new ones. */
export function deckSession(inp: SessionInput, deck: string, n: number): Slot[] {
  const r = new Rng(inp.seed)
  const card = new Map(inp.cards.map((c) => [c.id, c]))
  const cards = inp.bank.filter((e) => e.deck === deck)
  const due = cards.filter((e) => { const c = card.get(e.id); return c && c.seen > 0 && new Date(c.fsrs.due).getTime() <= inp.now })
  const fresh = r.shuffle(cards.filter((e) => !card.get(e.id) || card.get(e.id)!.seen === 0)).slice(0, n)
  return [...r.shuffle(due), ...fresh].map((e) => ({ id: e.id, why: 'deck' }))
}

export function weaknessSession(inp: SessionInput, w: Weakness, n: number): Slot[] {
  const r = new Rng(inp.seed)
  const pool = inp.bank.filter((e) => e.weak === w && isQuiz(e))
  const gens = pool.filter((e) => e.isGen)
  const out: Slot[] = r.shuffle(pool).map((e) => ({ id: e.id, why: 'weak' }))
  while (out.length < n && gens.length) out.push({ id: r.pick(gens).id, why: 'weak' })
  return out.slice(0, n)
}
