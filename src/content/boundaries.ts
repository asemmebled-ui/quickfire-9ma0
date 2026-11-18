/** Overall 9MA0 grade boundaries out of 300. See RESEARCH.md for sources. */
export interface Boundary { series: string; year: number; 'A*': number; A: number; B: number; C: number; D: number; E: number; verified: boolean; note?: string }

export const BOUNDARIES: Boundary[] = [
  { series: 'June 2026', year: 2026, 'A*': 254, A: 210, B: 173, C: 136, D: 100, E: 64, verified: true },
  { series: 'June 2025', year: 2025, 'A*': 258, A: 214, B: 178, C: 142, D: 106, E: 71, verified: true },
  { series: 'June 2024', year: 2024, 'A*': 251, A: 205, B: 167, C: 130, D: 93, E: 56, verified: true },
  { series: 'June 2023', year: 2023, 'A*': 244, A: 196, B: 158, C: 121, D: 84, E: 47, verified: true, note: 'Some post-pandemic protection' },
  { series: 'June 2022', year: 2022, 'A*': 217, A: 164, B: 130, C: 96, D: 62, E: 28, verified: true, note: 'Graded generously after the pandemic' },
  { series: 'June 2019', year: 2019, 'A*': 217, A: 165, B: 134, C: 103, D: 73, E: 43, verified: false, note: 'Secondary source' },
  { series: 'June 2018', year: 2018, 'A*': 229, A: 184, B: 155, C: 126, D: 98, E: 70, verified: false, note: 'Secondary source; first sitting, small cohort' },
]

export const GRADES = ['A*', 'A', 'B', 'C', 'D', 'E'] as const
export type Grade = (typeof GRADES)[number] | 'U'
export const LATEST = BOUNDARIES[0]
/** Years used for the "range across years" band (normal grading standards). */
export const RANGE_YEARS = BOUNDARIES.filter((b) => b.year >= 2023)

export function gradeFor(marks: number, b: Boundary = LATEST): Grade {
  for (const g of GRADES) if (marks >= b[g]) return g
  return 'U'
}
export function boundaryRange(g: (typeof GRADES)[number]): [number, number] {
  const xs = RANGE_YEARS.map((b) => b[g])
  return [Math.min(...xs), Math.max(...xs)]
}

/** Final Pearson timetable, summer 2027 (afternoon sessions). */
export const EXAM_DATES = { P1: '2027-05-26', P2: '2027-06-09', P3: '2027-06-16' }
