import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { BANK, ENTRY, GENERATORS, instantiate } from '../src/content/index'
import { DEFAULT_COVERED } from '../src/content/topics'
import { interleave, quickfire, todayPlan, examStyle, deckSession, weaknessSession, topicExamWeights } from '../src/lib/session'
import { Rng } from '../src/lib/rng'
import { db, exportBackup, importBackup, saveSettings, DEFAULT_SETTINGS } from '../src/lib/db'
import { recordAnswer } from '../src/lib/record'

const inp = (o = {}) => ({ bank: BANK, cards: [], attempts: [], papers: [], covered: DEFAULT_COVERED, now: Date.now(), seed: 42, ...o })

describe('sessions', () => {
  it('interleaves: no two consecutive topics the same when avoidable', () => {
    const xs = ['a', 'a', 'a', 'b', 'b', 'c', 'c', 'c'].map((t, i) => ({ id: String(i), t }))
    const out = interleave(xs, (x) => x.t, new Rng(1))
    for (let k = 1; k < out.length; k++) expect(out[k].t === out[k - 1].t).toBe(false)
  })
  it('only quizzes covered topics (plus general decks)', () => {
    for (const s of quickfire(inp(), 30)) expect(DEFAULT_COVERED).toContain(ENTRY[s.id].topic)
    for (const s of todayPlan(inp(), 20, 10)) expect(DEFAULT_COVERED).toContain(ENTRY[s.id].topic)
  })
  it('today includes exactly one weakness drill', () => {
    expect(todayPlan(inp(), 20, 10).filter((s) => s.why === 'weak').length).toBe(1)
  })
  it('exam-style, deck and weakness sessions return relevant items', () => {
    expect(examStyle(inp(), 10).length).toBeGreaterThan(0)
    expect(deckSession(inp(), 'trig-exact', 10).every((s) => ENTRY[s.id].deck === 'trig-exact')).toBe(true)
    expect(weaknessSession(inp(), 'logdomain', 8).every((s) => ENTRY[s.id].weak === 'logdomain')).toBe(true)
  })
  it('coverage-gap weighting favours topics that have appeared less', () => {
    const papers = [{ date: 0, paperId: 'x', section: 'P1' as const, timed: true, full: true, questions: [{ n: '1', got: 5, max: 40, topics: ['p1.12'] }] }]
    const w = topicExamWeights(papers, DEFAULT_COVERED)
    expect(w['p1.13'] / w['p1.12']).toBeGreaterThan(1)
  })
  it('every generator produces varied, valid questions', () => {
    for (const g of GENERATORS) {
      const stems = new Set(Array.from({ length: 8 }, (_, s) => g.make(s * 31 + 1).stem))
      expect(stems.size, g.id).toBeGreaterThan(1)
    }
    expect(instantiate('gen:indices', 5)?.type).toBe('numeric')
  })
})

describe('storage and backup', () => {
  it('records answers, exports and re-imports a backup exactly', async () => {
    await saveSettings({ ...DEFAULT_SETTINGS, minutes: 25 })
    const e = ENTRY['gen:disc'], item = instantiate('gen:disc', 1)!
    await recordAnswer(e, item, 1, 'sure', 5000, 30000)
    await recordAnswer(ENTRY['a1'], instantiate('a1', 0)!, 0, 'sure', 5000, 30000)
    const b = JSON.parse(JSON.stringify(await exportBackup()))
    expect(b.cards.length).toBe(2); expect(b.attempts.length).toBe(2); expect(b.settings.minutes).toBe(25)
    await db.cards.clear(); await db.attempts.clear()
    const r = await importBackup(b)
    expect(r).toEqual({ cards: 2, attempts: 2, papers: 0 })
    const c = await db.cards.get('gen:disc')
    expect(c!.fsrs.due instanceof Date).toBe(true)
    expect(c!.seen).toBe(1)
    await expect(importBackup({ foo: 1 })).rejects.toThrow(/not a Quickfire/)
  })
})
