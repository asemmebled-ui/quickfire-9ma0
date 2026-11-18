import Dexie, { type Table } from 'dexie'
import type { Attempt, PaperLog } from './types'
import type { FsrsCard } from './scheduler'
import { DEFAULT_COVERED } from '../content/topics'
import { EXAM_DATES } from '../content/boundaries'

export interface StoredCard { id: string; topic: string; fsrs: FsrsCard; seen: number; lastScore: number }
export interface Settings {
  covered: string[]
  minutes: number
  timer: boolean
  exams: { P1: string; P2: string; P3: string }
  xp: number
  streak: number
  lastDay: string
  theme: 'dark' | 'light'
}
export const DEFAULT_SETTINGS: Settings = {
  covered: DEFAULT_COVERED, minutes: 20, timer: true, exams: EXAM_DATES, xp: 0, streak: 0, lastDay: '', theme: 'dark',
}

class QfDb extends Dexie {
  cards!: Table<StoredCard, string>
  attempts!: Table<Attempt, number>
  papers!: Table<PaperLog, number>
  kv!: Table<{ key: string; value: unknown }, string>
  pdfs!: Table<{ id: string; name: string; blob: Blob }, string>
  constructor() {
    super('quickfire-9ma0')
    this.version(1).stores({ cards: 'id, topic', attempts: '++id, cardId, topic, ts', papers: '++id, date', kv: 'key', pdfs: 'id' })
  }
}
export const db = new QfDb()

export async function loadSettings(): Promise<Settings> {
  const row = await db.kv.get('settings')
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) }
}
export async function saveSettings(s: Settings): Promise<void> { await db.kv.put({ key: 'settings', value: s }) }

const BACKUP_VERSION = 1
export interface Backup { app: 'quickfire-9ma0'; version: number; exportedAt: string; cards: StoredCard[]; attempts: Attempt[]; papers: PaperLog[]; settings: Settings }

export async function exportBackup(): Promise<Backup> {
  return {
    app: 'quickfire-9ma0', version: BACKUP_VERSION, exportedAt: new Date().toISOString(),
    cards: await db.cards.toArray(), attempts: await db.attempts.toArray(), papers: await db.papers.toArray(), settings: await loadSettings(),
  }
}

/** Replace all local data with a backup. Throws on anything that is not one of our backups. */
export async function importBackup(raw: unknown): Promise<{ cards: number; attempts: number; papers: number }> {
  const b = raw as Backup
  if (!b || b.app !== 'quickfire-9ma0' || !Array.isArray(b.cards) || !Array.isArray(b.attempts)) throw new Error('This is not a Quickfire 9MA0 backup file.')
  if (b.version > BACKUP_VERSION) throw new Error('This backup was made by a newer version of the app.')
  const cards = b.cards.map((c) => ({
    ...c,
    fsrs: { ...c.fsrs, due: new Date(c.fsrs.due), last_review: c.fsrs.last_review ? new Date(c.fsrs.last_review) : undefined },
  }))
  await db.transaction('rw', db.cards, db.attempts, db.papers, db.kv, async () => {
    await Promise.all([db.cards.clear(), db.attempts.clear(), db.papers.clear()])
    await db.cards.bulkPut(cards)
    await db.attempts.bulkPut(b.attempts)
    await db.papers.bulkPut(b.papers ?? [])
    await saveSettings({ ...DEFAULT_SETTINGS, ...b.settings })
  })
  return { cards: cards.length, attempts: b.attempts.length, papers: (b.papers ?? []).length }
}

export async function wipeAll(): Promise<void> {
  await Promise.all([db.cards.clear(), db.attempts.clear(), db.papers.clear(), db.kv.clear(), db.pdfs.clear()])
}
