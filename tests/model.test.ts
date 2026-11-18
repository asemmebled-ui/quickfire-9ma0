import { describe, expect, it } from 'vitest'
import { predict, dailyTarget, K, type ModelInput } from '../src/lib/model'
import { newCard, review, Rating } from '../src/lib/scheduler'
import { TOPICS, TOPIC_MARKS, DEFAULT_COVERED } from '../src/content/topics'
import { BANK_SIZE } from '../src/content/index'
import { gradeFor, LATEST } from '../src/content/boundaries'
import type { Attempt, PaperLog } from '../src/lib/types'
import type { StoredCard } from '../src/lib/db'

const NOW = new Date('2027-03-01T12:00:00Z').getTime()
const ALL = TOPICS.map((t) => t.id)
const base = (o: Partial<ModelInput> = {}): ModelInput => ({ now: NOW, covered: ALL, cards: [], attempts: [], papers: [], bankSize: BANK_SIZE, ...o })

function strongStudent(score: number): Partial<ModelInput> {
  const cards: StoredCard[] = [], attempts: Attempt[] = []
  for (const t of TOPICS) for (let k = 0; k < 12; k++) {
    const id = `${t.id}-${k}`
    let c = newCard(new Date(NOW - 20 * 86400000))
    c = review(c, Rating.Good, new Date(NOW - 20 * 86400000))
    c = review(c, Rating.Good, new Date(NOW - 2 * 86400000))
    cards.push({ id, topic: t.id, fsrs: c, seen: 2, lastScore: 1 })
    attempts.push({ cardId: id, topic: t.id, ts: NOW - 86400000, score, conf: 'unsure', ms: 20000, kind: 'self', source: 'exam-style', rating: 3 })
  }
  return { cards, attempts }
}
const paper = (section: 'P1' | 'P2' | 'P3', frac: number, daysAgo = 5, timed = true): PaperLog => ({
  date: NOW - daysAgo * 86400000, paperId: `x-${section}`, section, timed, full: true,
  questions: [{ n: '1', got: Math.round(100 * frac), max: 100, topics: [] }],
})

describe('topic weights', () => {
  it('sum to 300 (200 Pure, 50 Statistics, 50 Mechanics)', () => {
    const sum = (s: string) => TOPICS.filter((t) => t.section === s).reduce((a, t) => a + TOPIC_MARKS[t.id], 0)
    expect(sum('pure')).toBeCloseTo(200); expect(sum('stats')).toBeCloseTo(50); expect(sum('mech')).toBeCloseTo(50)
  })
})

describe('prediction model', () => {
  it('with no evidence: low prediction, wide range, readiness capped', () => {
    const p = predict(base())
    expect(p.predicted).toBeLessThan(100)
    expect(p.high - p.low).toBeGreaterThan(40)
    expect(p.capped).toBe(true)
    expect(p.readiness).toBeLessThanOrEqual(K.readinessCapNoPaper)
  })
  it('uncovered topics count as not started (zero), not as weak evidence', () => {
    const p = predict(base({ covered: DEFAULT_COVERED }))
    for (const t of p.topics) if (!DEFAULT_COVERED.includes(t.id)) { expect(t.covered).toBe(false); expect(t.mastery).toBe(0) }
  })
  it('more and better evidence raises mastery; quick-fire alone cannot exceed the transfer cap', () => {
    const weak = predict(base(strongStudent(0.4))), strong = predict(base(strongStudent(1)))
    expect(strong.predicted).toBeGreaterThan(weak.predicted)
    expect(strong.predicted).toBeLessThanOrEqual(300 * K.transfer + 1e-9)
    expect(strong.capped).toBe(true) // no timed paper, so still capped however good quick-fire looks
    expect(strong.readiness).toBeLessThanOrEqual(K.readinessCapNoPaper)
  })
  it('logged timed papers pull the prediction towards real scores and narrow the range', () => {
    const before = predict(base(strongStudent(0.7)))
    const papers = [paper('P1', 0.9), paper('P2', 0.88), paper('P3', 0.92)]
    const after = predict(base({ ...strongStudent(0.7), papers }))
    expect(after.predicted).toBeGreaterThan(before.predicted)
    expect(after.high - after.low).toBeLessThan(before.high - before.low)
    expect(after.capped).toBe(false)
    expect(after.timedPapers).toBe(3)
  })
  it('old papers count less than recent ones', () => {
    const recent = predict(base({ papers: [paper('P1', 0.95, 3), paper('P2', 0.95, 3), paper('P3', 0.95, 3)] }))
    const old = predict(base({ papers: [paper('P1', 0.95, 400), paper('P2', 0.95, 400), paper('P3', 0.95, 400)] }))
    expect(recent.predicted).toBeGreaterThan(old.predicted)
  })
  it('high-confidence errors reduce mastery', () => {
    const s = strongStudent(1)
    const hce = { ...s, attempts: [...s.attempts!, ...TOPICS.flatMap((t) => Array.from({ length: 10 }, (_, k): Attempt => ({ cardId: `${t.id}-${k}`, topic: t.id, ts: NOW, score: 0, conf: 'sure', ms: 9000, kind: 'numeric', source: 'original', rating: 1 })))] }
    expect(predict(base(hce)).predicted).toBeLessThan(predict(base(s)).predicted)
  })
  it('maps marks to grades on the latest boundaries and reports marks to the next grade', () => {
    expect(gradeFor(LATEST['A*'])).toBe('A*'); expect(gradeFor(LATEST['A*'] - 1)).toBe('A'); expect(gradeFor(0)).toBe('U')
    const p = predict(base({ papers: [paper('P1', 0.75), paper('P2', 0.75), paper('P3', 0.75)] }))
    if (p.next) expect(p.next.marks).toBeGreaterThan(0)
    expect(p.summary).toMatch(/Predicted \d+–\d+\/300/)
  })
  it('ranks best topics by weight x gap x ease', () => {
    const p = predict(base())
    for (let k = 1; k < p.best.length; k++) expect(p.best[k - 1].gain).toBeGreaterThanOrEqual(p.best[k].gain)
  })
  it('daily target fits the time budget', () => {
    const d = dailyTarget(base({ covered: DEFAULT_COVERED }), '2027-05-26', 20)
    expect(d.reviews * 45 + d.newItems * 75).toBeLessThanOrEqual(20 * 60 + 3 * 75)
    expect(d.daysLeft).toBeGreaterThan(0)
  })
})
