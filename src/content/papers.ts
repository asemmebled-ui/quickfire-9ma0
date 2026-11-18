/**
 * Past-paper INDEX (metadata only). Pearson's papers are copyrighted: no question text is stored here.
 * Per-question topic tags are added by you when you log a paper (the app does not invent them).
 * Direct links are included only where the exact file URL was seen on qualifications.pearson.com;
 * otherwise use the search page with the paper code and date.
 */
export interface PaperRef { id: string; series: string; paper: 'P1' | 'P2' | 'P3'; code: string; date: string; url?: string; note?: string }

export const PEARSON_SEARCH = 'https://qualifications.pearson.com/en/support/support-topics/exams/past-papers.html'
const B = 'https://qualifications.pearson.com/content/dam/pdf/A-Level/Mathematics/2017/Exam-materials/'

const S = (series: string, date: string, urls: Partial<Record<'P1' | 'P2' | 'P3', string>> = {}, note?: string): PaperRef[] => [
  { id: `${series}-P1`, series, paper: 'P1', code: '9MA0/01', date, url: urls.P1, note },
  { id: `${series}-P2`, series, paper: 'P2', code: '9MA0/02', date, url: urls.P2, note },
  { id: `${series}-P3`, series, paper: 'P3', code: '9MA0/03 (published as /31 Statistics and /32 Mechanics)', date, url: urls.P3, note },
]

export const PAPERS: PaperRef[] = [
  ...S('Specimen', '2017', {}, 'Sample assessment materials'),
  ...S('June 2018', '2018-06', { P1: B + '9ma0-01-que-2018.pdf', P3: B + '9ma0-03-que-2018.pdf' }),
  ...S('June 2019', '2019-06', { P2: B + '9MA0_02_que_20190613.pdf' }),
  ...S('October 2020', '2020-10', { P2: B + '9MA0_02_que_20201015.pdf' }, 'Autumn series'),
  ...S('November 2021', '2021-11', {}, 'Autumn series'),
  ...S('June 2022', '2022-06', { P1: B + '9ma0-01-que-20220608.pdf' }),
  ...S('June 2023', '2023-06', { P1: B + '9ma0-01-que-20230607.pdf' }),
  ...S('June 2024', '2024-06', {}),
  ...S('June 2025', '2025-06', { P3: B + '9ma0-32-que-20250620.pdf' }, 'Recent papers may be restricted to centres for a period'),
  ...S('June 2026', '2026-06', {}, 'Probably restricted to centres until later in the course'),
]
export const PAPER: Record<string, PaperRef> = Object.fromEntries(PAPERS.map((p) => [p.id, p]))
