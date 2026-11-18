/**
 * Readiness model. Pure functions: data in, numbers out. Documented in PLAN.md and on the in-app
 * "How is this calculated?" screen. Every constant here is a stated judgement, not a measured fact.
 */
import type { Attempt, PaperLog, Section } from './types'
import type { StoredCard } from './db'
import { cardRetrievability } from './scheduler'
import { TOPICS, TOPIC, TOPIC_MARKS, SECTION_MARKS } from '../content/topics'
import { GRADES, LATEST, gradeFor, boundaryRange, type Grade } from '../content/boundaries'

const DAY = 86400000
export const K = {
  priorMastery: 0.3, priorN: 3,          // shrinkage prior: no evidence is not mastery
  recallN: 0.5, recallCap: 12,           // weight per seen card (quick-fire recall)
  examN: 1.5, examCap: 10, examHalfLife: 60,  // exam-style / self-marked attempts
  paperN: 0.6, paperHalfLife: 90,        // logged past-paper marks (per mark available)
  hcePenalty: 0.15,                      // penalty for high-confidence errors
  transfer: 0.85,                        // quick-fire mastery overstates exam marks
  modelWeight: 1, timedWeight: 2, untimedWeight: 1,
  uMin: 0.05, uExtra: 0.07,              // model uncertainty: 12% of section marks with no papers
  z80: 1.28,
  readinessCapNoPaper: 60,
}

export interface ModelInput {
  now: number
  covered: string[]
  cards: StoredCard[]
  attempts: Attempt[]
  papers: PaperLog[]
  /** number of schedulable cards per topic in the content bank */
  bankSize: Record<string, number>
}

export interface TopicState {
  id: string; covered: boolean; marks: number
  mastery: number; evidence: number
  seen: number; total: number; due: number
  recall: number | null; exam: number | null; paper: number | null; hce: number
}
export interface SectionState { section: Section; marks: number; model: number; paper: number | null; paperWeight: number; predicted: number; sd: number }
export interface Prediction {
  topics: TopicState[]
  sections: SectionState[]
  predicted: number; low: number; high: number
  grade: Grade; gradeLow: Grade; gradeHigh: Grade
  summary: string
  next: { grade: Grade; marks: number } | null
  readiness: number; capped: boolean
  parts: { coverage: number; retention: number; predicted: number; exam: number }
  best: { id: string; gain: number }[]
  timedPapers: number
}

const half = (ageDays: number, halfLife: number) => Math.pow(0.5, Math.max(0, ageDays) / halfLife)

export function topicStates(inp: ModelInput): TopicState[] {
  const { now } = inp
  const covered = new Set(inp.covered)
  return TOPICS.map((t) => {
    const cards = inp.cards.filter((c) => c.topic === t.id && c.seen > 0)
    const total = Math.max(inp.bankSize[t.id] ?? 0, cards.length)
    const seen = cards.length
    const due = cards.filter((c) => new Date(c.fsrs.due).getTime() <= now).length
    let recall: number | null = null
    if (seen) {
      const meanR = cards.reduce((s, c) => s + cardRetrievability(c.fsrs, now), 0) / seen
      recall = meanR * (0.5 + 0.5 * Math.min(1, seen / Math.max(1, total)))
    }
    const atts = inp.attempts.filter((a) => a.topic === t.id)
    const examAtts = atts.filter((a) => a.source === 'exam-style' || a.kind === 'self').slice(-20)
    let exam: number | null = null
    if (examAtts.length) {
      let sw = 0, sv = 0
      for (const a of examAtts) { const w = half((now - a.ts) / DAY, K.examHalfLife); sw += w; sv += w * a.score }
      exam = sv / sw
    }
    let pGot = 0, pMax = 0
    for (const p of inp.papers) {
      const w = half((now - p.date) / DAY, K.paperHalfLife) * (p.timed ? 1 : 0.5)
      for (const q of p.questions) {
        if (!q.topics.includes(t.id) || q.max <= 0) continue
        const share = 1 / q.topics.length
        pGot += w * share * q.got; pMax += w * share * q.max
      }
    }
    const paper = pMax > 0 ? pGot / pMax : null
    const recent = atts.slice(-30)
    const hce = recent.length ? recent.filter((a) => a.conf === 'sure' && a.score < 0.6).length / recent.length : 0

    const nR = recall === null ? 0 : K.recallN * Math.min(seen, K.recallCap)
    const nE = exam === null ? 0 : K.examN * Math.min(examAtts.length, K.examCap)
    const nP = K.paperN * pMax
    const evidence = nR + nE + nP
    let mastery = (K.priorN * K.priorMastery + nR * (recall ?? 0) + nE * (exam ?? 0) + nP * (paper ?? 0)) / (K.priorN + evidence)
    mastery *= 1 - K.hcePenalty * hce
    const isCovered = covered.has(t.id)
    if (!isCovered) mastery = 0
    return { id: t.id, covered: isCovered, marks: TOPIC_MARKS[t.id], mastery, evidence: isCovered ? evidence : 0, seen, total, due, recall, exam, paper, hce }
  })
}

/** Direct evidence from full papers: weighted mean fraction for each section. */
function paperEvidence(papers: PaperLog[], now: number): Record<Section, { frac: number; w: number }> {
  const acc: Record<Section, { g: number; m: number; w: number }> = { pure: { g: 0, m: 0, w: 0 }, stats: { g: 0, m: 0, w: 0 }, mech: { g: 0, m: 0, w: 0 } }
  for (const p of papers) {
    if (!p.full) continue
    const w = half((now - p.date) / DAY, K.paperHalfLife) * (p.timed ? K.timedWeight : K.untimedWeight)
    const got = p.questions.reduce((s, q) => s + q.got, 0), max = p.questions.reduce((s, q) => s + q.max, 0)
    if (max <= 0) continue
    if (p.section !== 'P3') { acc.pure.g += w * got; acc.pure.m += w * max; acc.pure.w += w; continue }
    // Paper 3: split by tagged section where possible, otherwise apply the overall fraction to both halves
    for (const sec of ['stats', 'mech'] as const) {
      const qs = p.questions.filter((q) => q.topics.length && q.topics.every((id) => TOPIC[id]?.section === sec))
      const sm = qs.reduce((s, q) => s + q.max, 0)
      if (sm > 0) { acc[sec].g += w * qs.reduce((s, q) => s + q.got, 0); acc[sec].m += w * sm } else { acc[sec].g += w * got; acc[sec].m += w * max }
      acc[sec].w += w
    }
  }
  const out = {} as Record<Section, { frac: number; w: number }>
  for (const s of ['pure', 'stats', 'mech'] as const) out[s] = { frac: acc[s].m > 0 ? acc[s].g / acc[s].m : 0, w: acc[s].w }
  return out
}

const prevGrade = (g: Grade): Grade | null => { const all: Grade[] = [...GRADES, 'U']; const i = all.indexOf(g); return i > 0 ? all[i - 1] : null }

export function predict(inp: ModelInput): Prediction {
  const topics = topicStates(inp)
  const pe = paperEvidence(inp.papers, inp.now)
  const sections: SectionState[] = (['pure', 'stats', 'mech'] as const).map((section) => {
    const ts = topics.filter((t) => TOPIC[t.id].section === section)
    const marks = SECTION_MARKS[section]
    const model = ts.reduce((s, t) => s + t.marks * t.mastery, 0) * K.transfer
    const pw = pe[section].w
    const paper = pw > 0 ? pe[section].frac * marks : null
    const predicted = paper === null ? model : (K.modelWeight * model + pw * paper) / (K.modelWeight + pw)
    const evVar = ts.reduce((s, t) => s + (t.covered ? (t.marks * t.marks * t.mastery * (1 - t.mastery)) / (t.evidence + 1) : 0), 0)
    const u = (K.uMin + K.uExtra * Math.exp(-pw / 2)) * marks
    const shrink = K.modelWeight / (K.modelWeight + pw)
    return { section, marks, model, paper, paperWeight: pw, predicted, sd: Math.sqrt(evVar * shrink * shrink + u * u) }
  })
  const predicted = sections.reduce((s, x) => s + x.predicted, 0)
  const sd = Math.sqrt(sections.reduce((s, x) => s + x.sd * x.sd, 0))
  const low = Math.max(0, predicted - K.z80 * sd), high = Math.min(300, predicted + K.z80 * sd)
  const grade = gradeFor(predicted), gradeLow = gradeFor(low), gradeHigh = gradeFor(high)

  const up = prevGrade(grade)
  const next = up && up !== 'U' ? { grade: up, marks: Math.max(1, Math.ceil(LATEST[up as 'A'] - predicted)) } : null
  let summary = `Predicted ${Math.round(low)}–${Math.round(high)}/300`
  if (gradeLow === gradeHigh) summary += ` → ${grade}${grade === 'A*' ? ' looks secure on this evidence' : ''}`
  else summary += ` → likely ${grade}, ${gradeHigh} possible, ${gradeLow} not ruled out`
  if (grade !== 'A*' && gradeHigh !== 'A*') summary += '; A* not yet in range'
  else if (gradeLow !== 'A*') summary += '; A* not yet secure'

  // readiness
  const coverage = topics.reduce((s, t) => s + (t.covered ? t.marks : 0), 0) / 300
  const seenCards = inp.cards.filter((c) => c.seen > 0)
  const retention = seenCards.length ? seenCards.filter((c) => new Date(c.fsrs.due).getTime() > inp.now).length / seenCards.length : 0
  const target = LATEST['A*']
  const predPart = Math.min(1, predicted / target)
  const timed = inp.papers.filter((p) => p.full && p.timed)
  let ew = 0, ev = 0
  for (const p of timed) {
    const w = half((inp.now - p.date) / DAY, K.paperHalfLife)
    const got = p.questions.reduce((s, q) => s + q.got, 0), max = p.questions.reduce((s, q) => s + q.max, 0)
    if (max > 0) { ew += w; ev += w * Math.min(1, got / max / (target / 300)) }
  }
  // a single old paper should not count as full exam evidence: scale by total (decayed) weight up to 1
  const exam = ew > 0 ? (ev / ew) * Math.min(1, ew) : 0
  let readiness = 100 * (0.25 * coverage + 0.15 * retention + 0.3 * predPart + 0.3 * exam)
  const capped = timed.length === 0
  if (capped) readiness = Math.min(readiness, K.readinessCapNoPaper)

  const best = topics.filter((t) => t.covered)
    .map((t) => ({ id: t.id, gain: t.marks * (1 - t.mastery) * TOPIC[t.id].ease }))
    .sort((a, b) => b.gain - a.gain).slice(0, 5)

  return { topics, sections, predicted, low, high, grade, gradeLow, gradeHigh, summary, next, readiness, capped,
    parts: { coverage, retention, predicted: predPart, exam }, best, timedPapers: timed.length }
}

export interface DailyTarget { reviews: number; newItems: number; daysLeft: number; minutes: number }
/** Reviews due now, plus enough new items to see every covered item three weeks before Paper 1. */
export function dailyTarget(inp: ModelInput, firstExam: string, minutes: number): DailyTarget {
  const covered = new Set(inp.covered)
  const daysLeft = Math.max(0, Math.ceil((new Date(firstExam + 'T13:30:00').getTime() - inp.now) / DAY))
  const seenIds = new Set(inp.cards.filter((c) => c.seen > 0).map((c) => c.id))
  const due = inp.cards.filter((c) => c.seen > 0 && new Date(c.fsrs.due).getTime() <= inp.now && (covered.has(c.topic) || c.topic.startsWith('x.'))).length
  const total = Object.entries(inp.bankSize).filter(([id]) => covered.has(id) || id.startsWith('x.')).reduce((s, [, n]) => s + n, 0)
  const unseen = Math.max(0, total - [...seenIds].length)
  const need = Math.ceil(unseen / Math.max(1, daysLeft - 21))
  const budget = minutes * 60
  const reviews = Math.min(due, Math.floor((budget * 0.7) / 45))
  const room = Math.max(0, Math.floor((budget - reviews * 45) / 75))
  // at least the pace needed to finish before Paper 1; otherwise fill the time budget (capped at 12 new a day)
  const newItems = Math.min(unseen, Math.max(need, Math.min(room, 12)))
  return { reviews, newItems, daysLeft, minutes }
}

export { boundaryRange }
