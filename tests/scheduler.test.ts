import { describe, expect, it } from 'vitest'
import { newCard, ratingFor, review, retrievability, cardRetrievability, Rating, RETENTION } from '../src/lib/scheduler'

const D = 86400000
const t0 = new Date('2026-12-01T09:00:00Z')

describe('FSRS integration (ts-fsrs, FSRS-6 weights)', () => {
  it('maps confidence and correctness to ratings', () => {
    expect(ratingFor(0, 'sure', true)).toBe(Rating.Again)
    expect(ratingFor(0.5, 'unsure', true)).toBe(Rating.Again)
    expect(ratingFor(0.75, 'sure', true)).toBe(Rating.Hard)
    expect(ratingFor(1, 'guess', true)).toBe(Rating.Hard)
    expect(ratingFor(1, 'unsure', true)).toBe(Rating.Good)
    expect(ratingFor(1, 'sure', true)).toBe(Rating.Easy)
    expect(ratingFor(1, 'sure', false)).toBe(Rating.Good)
  })
  it('schedules a new card further ahead for better ratings', () => {
    const c = newCard(t0)
    const due = (r: number) => new Date(review(c, r as never, t0).due).getTime() - t0.getTime()
    expect(due(Rating.Again)).toBeLessThan(due(Rating.Hard))
    expect(due(Rating.Hard)).toBeLessThanOrEqual(due(Rating.Good))
    expect(due(Rating.Good)).toBeLessThan(due(Rating.Easy))
  })
  it('grows intervals with repeated success and shrinks after a lapse', () => {
    let c = review(newCard(t0), Rating.Good, t0)
    const i1 = new Date(c.due).getTime() - t0.getTime()
    const t1 = new Date(c.due)
    c = review(c, Rating.Good, t1)
    const i2 = new Date(c.due).getTime() - t1.getTime()
    expect(i2).toBeGreaterThan(i1)
    const t2 = new Date(c.due)
    const lapsed = review(c, Rating.Again, t2)
    expect(new Date(lapsed.due).getTime() - t2.getTime()).toBeLessThan(i2)
    expect(lapsed.lapses).toBe(1)
  })
  it('retrievability is 1 at review, equals the target retention at the scheduled interval, and decays', () => {
    expect(retrievability(5, 0)).toBeCloseTo(1)
    expect(retrievability(5, 5)).toBeCloseTo(RETENTION, 6) // FSRS: R = 0.9 when t = S
    expect(retrievability(5, 20)).toBeLessThan(retrievability(5, 10))
    const c = review(newCard(t0), Rating.Good, t0)
    expect(cardRetrievability(c, t0.getTime() + 30 * D)).toBeLessThan(cardRetrievability(c, t0.getTime() + D))
    expect(cardRetrievability(newCard(t0), t0.getTime())).toBe(0)
  })
  it('survives a JSON round trip (backup format)', () => {
    const c = review(newCard(t0), Rating.Good, t0)
    const back = JSON.parse(JSON.stringify(c))
    const revived = { ...back, due: new Date(back.due), last_review: new Date(back.last_review) }
    expect(() => review(revived, Rating.Good, new Date(revived.due))).not.toThrow()
  })
})
