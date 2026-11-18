import { db, loadSettings, saveSettings, type StoredCard } from './db'
import { newCard, ratingFor, review } from './scheduler'
import type { Confidence, Item } from './types'
import type { Entry } from '../content/index'

const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10)

/**
 * Record one answer: update the FSRS card, log the attempt, update XP/streak (display only:
 * XP and streak never influence scheduling).
 */
export async function recordAnswer(entry: Entry, item: Item, score: number, conf: Confidence, ms: number, targetMs: number, now = Date.now()) {
  const prev = await db.cards.get(entry.id)
  const base = prev?.fsrs ?? newCard(new Date(now))
  const rating = ratingFor(score, conf, ms <= targetMs)
  const next = review(base, rating, new Date(now))
  const stored: StoredCard = { id: entry.id, topic: entry.topic, fsrs: next, seen: (prev?.seen ?? 0) + 1, lastScore: score }
  await db.cards.put(stored)
  await db.attempts.add({ cardId: entry.id, topic: entry.topic, ts: now, score, conf, ms, kind: item.type, source: item.source, rating })
  const s = await loadSettings()
  const today = dayKey(now), yesterday = dayKey(now - 86400000)
  s.streak = s.lastDay === today ? s.streak : s.lastDay === yesterday ? s.streak + 1 : 1
  s.lastDay = today
  s.xp += Math.round(10 * score) + (conf === 'sure' && score >= 1 ? 2 : 0)
  await saveSettings(s)
  return { rating, due: next.due }
}
