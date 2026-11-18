import { fsrs, generatorParameters, createEmptyCard, Rating, default_w, type Card, type Grade as FsrsGrade } from 'ts-fsrs'
import type { Confidence } from './types'

/** FSRS-6 (21 weights) with 90% desired retention. Fuzz is on so reviews do not clump on one day. */
export const RETENTION = 0.9
const params = generatorParameters({ request_retention: RETENTION, enable_fuzz: true, enable_short_term: false, maximum_interval: 365 })
const engine = fsrs(params)
if (default_w.length !== 21) throw new Error('Expected FSRS-6 default weights (21 parameters)')

export type FsrsCard = Card
export const newCard = (now: Date): FsrsCard => createEmptyCard(now)

/**
 * Map an answer to an FSRS rating.
 * Confidence is collected BEFORE the answer is revealed. A wrong answer is always "Again".
 * A correct "Sure" answer is only "Easy" if it was also within the time target.
 */
export function ratingFor(score: number, conf: Confidence, withinTime: boolean): FsrsGrade {
  if (score < 0.6) return Rating.Again
  if (score < 0.999) return Rating.Hard
  if (conf === 'guess') return Rating.Hard
  if (conf === 'unsure') return Rating.Good
  return withinTime ? Rating.Easy : Rating.Good
}

export function review(card: FsrsCard, rating: FsrsGrade, now: Date): FsrsCard {
  return engine.next(card, now, rating).card
}

const DECAY = default_w[20]
const FACTOR = Math.pow(RETENTION, -1 / DECAY) - 1
/** FSRS-6 forgetting curve: probability of recalling the card after `days` given stability S. */
export function retrievability(stability: number, days: number): number {
  if (!(stability > 0)) return 0
  return Math.pow(1 + (FACTOR * Math.max(0, days)) / stability, -DECAY)
}
export function cardRetrievability(card: FsrsCard, now: number): number {
  if (!card.last_review) return 0
  return retrievability(card.stability, (now - new Date(card.last_review).getTime()) / 86400000)
}
export { Rating }
