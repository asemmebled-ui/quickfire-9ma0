import type { Topic, Section } from '../lib/types'

/**
 * Topics follow the chapter structure of the Pearson Edexcel textbooks:
 * Pure Year 1, Pure Year 2, Statistics & Mechanics Year 1, Statistics & Mechanics Year 2.
 * `w` is an ESTIMATE of marks per 300 (before normalising Pure to 200, Statistics to 50, Mechanics to 50).
 * These are judgement-based starting weights, not published figures.
 */
const t = (id: string, name: string, section: Section, year: 1 | 2, book: string, spec: string[], w: number, ease: number): Topic =>
  ({ id, name, section, year, book, spec, w, ease })

export const TOPICS: Topic[] = [
  t('p1.1', 'Algebraic expressions', 'pure', 1, 'Pure Y1 Ch 1', ['P2.1', 'P2.2'], 3, 1),
  t('p1.2', 'Quadratics', 'pure', 1, 'Pure Y1 Ch 2', ['P2.3'], 4, 1),
  t('p1.3', 'Equations and inequalities', 'pure', 1, 'Pure Y1 Ch 3', ['P2.4', 'P2.5'], 4, 0.9),
  t('p1.4', 'Graphs and transformations', 'pure', 1, 'Pure Y1 Ch 4', ['P2.7', 'P2.9'], 5, 0.8),
  t('p1.5', 'Straight line graphs', 'pure', 1, 'Pure Y1 Ch 5', ['P3.1'], 4, 1),
  t('p1.6', 'Circles', 'pure', 1, 'Pure Y1 Ch 6', ['P3.2'], 6, 0.8),
  t('p1.7', 'Algebraic methods and proof', 'pure', 1, 'Pure Y1 Ch 7', ['P1.1', 'P2.6'], 7, 0.7),
  t('p1.8', 'The binomial expansion', 'pure', 1, 'Pure Y1 Ch 8', ['P4.1'], 4, 0.9),
  t('p1.9', 'Trigonometric ratios', 'pure', 1, 'Pure Y1 Ch 9', ['P5.1', 'P5.3'], 4, 0.9),
  t('p1.10', 'Trigonometric identities and equations', 'pure', 1, 'Pure Y1 Ch 10', ['P5.5', 'P5.7'], 6, 0.7),
  t('p1.11', 'Vectors (2D)', 'pure', 1, 'Pure Y1 Ch 11', ['P10.1', 'P10.2', 'P10.3', 'P10.4', 'P10.5'], 4, 0.9),
  t('p1.12', 'Differentiation', 'pure', 1, 'Pure Y1 Ch 12', ['P7.1', 'P7.2', 'P7.3'], 9, 0.9),
  t('p1.13', 'Integration', 'pure', 1, 'Pure Y1 Ch 13', ['P8.1', 'P8.2', 'P8.3'], 8, 0.9),
  t('p1.14', 'Exponentials and logarithms', 'pure', 1, 'Pure Y1 Ch 14', ['P6.1', 'P6.2', 'P6.3', 'P6.4', 'P6.5', 'P6.6', 'P6.7'], 12, 0.8),

  t('p2.1', 'Algebraic methods (partial fractions, contradiction)', 'pure', 2, 'Pure Y2 Ch 1', ['P1.1', 'P2.6', 'P2.10'], 8, 0.8),
  t('p2.2', 'Functions and graphs', 'pure', 2, 'Pure Y2 Ch 2', ['P2.7', 'P2.8', 'P2.9', 'P2.11'], 12, 0.7),
  t('p2.3', 'Sequences and series', 'pure', 2, 'Pure Y2 Ch 3', ['P4.2', 'P4.3', 'P4.4', 'P4.5', 'P4.6'], 14, 0.8),
  t('p2.4', 'Binomial expansion (any rational n)', 'pure', 2, 'Pure Y2 Ch 4', ['P4.1'], 6, 0.9),
  t('p2.5', 'Radians', 'pure', 2, 'Pure Y2 Ch 5', ['P5.1', 'P5.2'], 8, 0.9),
  t('p2.6', 'Trigonometric functions (sec, cosec, cot, inverses)', 'pure', 2, 'Pure Y2 Ch 6', ['P5.4', 'P5.5'], 8, 0.7),
  t('p2.7', 'Trigonometry and modelling', 'pure', 2, 'Pure Y2 Ch 7', ['P5.6', 'P5.8', 'P5.9'], 14, 0.6),
  t('p2.8', 'Parametric equations', 'pure', 2, 'Pure Y2 Ch 8', ['P3.3', 'P3.4'], 8, 0.7),
  t('p2.9', 'Differentiation (chain, product, quotient, implicit)', 'pure', 2, 'Pure Y2 Ch 9', ['P7.1', 'P7.2', 'P7.4', 'P7.5', 'P7.6'], 16, 0.8),
  t('p2.10', 'Numerical methods', 'pure', 2, 'Pure Y2 Ch 10', ['P9.1', 'P9.2', 'P9.3', 'P9.5'], 8, 0.9),
  t('p2.11', 'Integration (methods, areas, differential equations)', 'pure', 2, 'Pure Y2 Ch 11', ['P8.2', 'P8.3', 'P8.4', 'P8.5', 'P8.6', 'P8.7', 'P8.8', 'P9.4'], 26, 0.6),
  t('p2.12', 'Vectors (3D)', 'pure', 2, 'Pure Y2 Ch 12', ['P10.1', 'P10.2', 'P10.3', 'P10.4', 'P10.5'], 4, 0.9),

  t('s1.1', 'Data collection and sampling', 'stats', 1, 'Stats & Mech Y1 Ch 1', ['S1.1'], 4, 1),
  t('s1.2', 'Measures of location and spread', 'stats', 1, 'Stats & Mech Y1 Ch 2', ['S2.3'], 5, 0.9),
  t('s1.3', 'Representations of data', 'stats', 1, 'Stats & Mech Y1 Ch 3', ['S2.1', 'S2.4'], 4, 0.9),
  t('s1.4', 'Correlation', 'stats', 1, 'Stats & Mech Y1 Ch 4', ['S2.2'], 3, 1),
  t('s1.5', 'Probability', 'stats', 1, 'Stats & Mech Y1 Ch 5', ['S3.1'], 5, 0.9),
  t('s1.6', 'Statistical distributions (binomial)', 'stats', 1, 'Stats & Mech Y1 Ch 6', ['S4.1'], 5, 0.9),
  t('s1.7', 'Hypothesis testing (binomial)', 'stats', 1, 'Stats & Mech Y1 Ch 7', ['S5.1', 'S5.2'], 7, 0.7),
  t('s2.1', 'Regression, correlation and hypothesis testing', 'stats', 2, 'Stats & Mech Y2 Ch 1', ['S2.2', 'S5.1'], 5, 0.8),
  t('s2.2', 'Conditional probability', 'stats', 2, 'Stats & Mech Y2 Ch 2', ['S3.2', 'S3.3'], 6, 0.8),
  t('s2.3', 'The normal distribution', 'stats', 2, 'Stats & Mech Y2 Ch 3', ['S4.2', 'S4.3', 'S5.3'], 11, 0.7),

  t('m1.8', 'Modelling in mechanics', 'mech', 1, 'Stats & Mech Y1 Ch 8', ['M6.1'], 2, 1),
  t('m1.9', 'Constant acceleration', 'mech', 1, 'Stats & Mech Y1 Ch 9', ['M7.1', 'M7.2', 'M7.3'], 6, 0.9),
  t('m1.10', 'Forces and motion', 'mech', 1, 'Stats & Mech Y1 Ch 10', ['M8.1', 'M8.2', 'M8.3', 'M8.4'], 8, 0.8),
  t('m1.11', 'Variable acceleration', 'mech', 1, 'Stats & Mech Y1 Ch 11', ['M7.4'], 5, 0.9),
  t('m2.4', 'Moments', 'mech', 2, 'Stats & Mech Y2 Ch 4', ['M9.1'], 6, 0.8),
  t('m2.5', 'Forces and friction', 'mech', 2, 'Stats & Mech Y2 Ch 5', ['M8.5', 'M8.6'], 6, 0.7),
  t('m2.6', 'Projectiles', 'mech', 2, 'Stats & Mech Y2 Ch 6', ['M7.5'], 8, 0.7),
  t('m2.7', 'Applications of forces', 'mech', 2, 'Stats & Mech Y2 Ch 7', ['M8.2', 'M8.4', 'M8.5', 'M8.6'], 7, 0.6),
  t('m2.8', 'Further kinematics (vectors and calculus)', 'mech', 2, 'Stats & Mech Y2 Ch 8', ['M7.3', 'M7.4'], 7, 0.8),
]

export const TOPIC: Record<string, Topic> = Object.fromEntries(TOPICS.map((x) => [x.id, x]))
export const SECTION_MARKS: Record<Section, number> = { pure: 200, stats: 50, mech: 50 }
export const SECTION_NAME: Record<Section, string> = { pure: 'Pure (Papers 1 & 2)', stats: 'Paper 3A Statistics', mech: 'Paper 3B Mechanics' }

const sectionSum: Record<Section, number> = { pure: 0, stats: 0, mech: 0 }
for (const x of TOPICS) sectionSum[x.section] += x.w
/** Expected marks per full 300-mark exam for each topic. */
export const TOPIC_MARKS: Record<string, number> = Object.fromEntries(
  TOPICS.map((x) => [x.id, (x.w / sectionSum[x.section]) * SECTION_MARKS[x.section]]),
)

/** Astral has finished all of Year 1 Pure; everything else starts as "not started". */
export const DEFAULT_COVERED: string[] = TOPICS.filter((x) => x.section === 'pure' && x.year === 1).map((x) => x.id)

/** Every content point of the 9MA0 specification (Issue 4). P = Pure, S = Statistics, M = Mechanics. */
const range = (p: string, n: number, k: number) => Array.from({ length: k }, (_, i) => `${p}${n}.${i + 1}`)
export const SPEC_POINTS: string[] = [
  ...range('P', 1, 1), ...range('P', 2, 11), ...range('P', 3, 4), ...range('P', 4, 6), ...range('P', 5, 9),
  ...range('P', 6, 7), ...range('P', 7, 6), ...range('P', 8, 8), ...range('P', 9, 5), ...range('P', 10, 5),
  ...range('S', 1, 1), ...range('S', 2, 4), ...range('S', 3, 3), ...range('S', 4, 3), ...range('S', 5, 3),
  ...range('M', 6, 1), ...range('M', 7, 5), ...range('M', 8, 6), ...range('M', 9, 1),
]

export const isPseudoTopic = (id: string) => id.startsWith('x.')
