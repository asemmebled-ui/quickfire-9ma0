export type Section = 'pure' | 'stats' | 'mech'
export type ItemType = 'numeric' | 'mcq' | 'method' | 'expr' | 'self' | 'card'
export type Weakness = 'const' | 'logdomain' | 'vecunits'
export type Source = 'original' | 'exam-style'

/** Verification spec: `s` is a SymPy expression that recomputes the answer independently. */
export interface Verify {
  s: string
  /** variables for expression answers (default: item answer vars) */
  vars?: string[]
  /** explicit expected value when the answer is not parseable maths (e.g. text MCQ options) */
  val?: number
}

export type Diagram =
  | { k: 'graph'; fns: string[]; x: [number, number]; y: [number, number]; pts?: [number, number, string?][]; shade?: [number, number]; vlines?: number[] }
  | { k: 'incline'; angle: number; forces: { dir: 'up' | 'down' | 'normal' | 'weight' | 'horiz'; label: string }[]; rough?: boolean }
  | { k: 'forces'; forces: { deg: number; label: string }[] }
  | { k: 'projectile'; angle: number; h?: number; labelU?: string }
  | { k: 'venn'; a: string; b: string; ab: string; out: string; la?: string; lb?: string }
  | { k: 'tree'; l1: [string, string][]; l2: [string, string][][] }
  | { k: 'normal'; lo?: number; hi?: number; labels?: [number, string][] }
  | { k: 'vectors'; vs: { from: [number, number]; to: [number, number]; label: string }[] }
  | { k: 'pulley'; m1: string; m2: string; table?: boolean; incline?: number }
  | { k: 'beam'; len: number; supports: number[]; loads: { at: number; label: string; up?: boolean }[] }
  | { k: 'vt'; pts: [number, number][]; xl?: string; yl?: string }
  | { k: 'box'; five: [number, number, number, number, number]; outliers?: number[] }
  | { k: 'hist'; bars: [number, number, number][] }
  | { k: 'scatter'; pts: [number, number][]; line?: [number, number]; xl?: string; yl?: string }
  | { k: 'sector'; angle: number; r: string; theta: string }
  | { k: 'triangle'; a?: string; b?: string; c?: string; A?: string; B?: string; C?: string }

interface Base {
  id: string
  topic: string
  spec: string[]
  diff: 1 | 2 | 3 | 4 | 5
  type: ItemType
  stem: string
  solution: string
  err?: string
  memo?: 'memorise' | 'booklet'
  source: Source
  diagram?: Diagram
  weak?: Weakness
  /** target seconds */
  t?: number
  v?: Verify
  deck?: string
}
export interface NumericItem extends Base { type: 'numeric'; value: number; sf?: number; exact?: boolean; unit?: string; tol?: number }
export interface McqItem extends Base { type: 'mcq' | 'method'; options: string[] /** options[0] is correct; shuffled at display */ }
export interface ExprItem extends Base { type: 'expr'; latex: string; vars: string[]; addC?: boolean; range?: [number, number] }
export interface SelfItem extends Base { type: 'self'; marks: { code: string; text: string }[] }
export interface CardItem extends Base { type: 'card' }
export type Item = NumericItem | McqItem | ExprItem | SelfItem | CardItem

export interface Generator {
  id: string
  topic: string
  spec: string[]
  diff: 1 | 2 | 3 | 4 | 5
  name: string
  weak?: Weakness
  source?: Source
  make: (seed: number) => Item
}

export interface Topic {
  id: string
  name: string
  section: Section
  year: 1 | 2
  book: string
  spec: string[]
  /** estimated marks per 300 before normalisation */
  w: number
  /** how quickly revision converts to marks (0.4 hard – 1 routine) */
  ease: number
}

export type Confidence = 'guess' | 'unsure' | 'sure'

export interface Attempt {
  id?: number
  cardId: string
  topic: string
  ts: number
  score: number // 0..1
  conf: Confidence
  ms: number
  kind: ItemType
  source: Source
  rating: number
}

export interface PaperLog {
  id?: number
  date: number
  paperId: string // e.g. 2024-06-P1 or 'custom'
  section: 'P1' | 'P2' | 'P3'
  timed: boolean
  full: boolean
  questions: { n: string; got: number; max: number; topics: string[] }[]
}
