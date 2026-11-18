import type { Prediction } from '../lib/model'
import type { Attempt } from '../lib/types'
import { BOUNDARIES, GRADES, LATEST, RANGE_YEARS, boundaryRange } from '../content/boundaries'
import { TOPIC, TOPICS, SECTION_NAME } from '../content/topics'

export interface Snapshot { date: string; predicted: number; low: number; high: number; readiness: number }

/** Horizontal 0–300 gauge: latest boundaries as bands, multi-year range as ticks, prediction as a range bar. */
export function Gauge({ p }: { p: Prediction }) {
  const W = 340, X = (m: number) => 10 + (m / 300) * (W - 20)
  const marks = [0, ...[...GRADES].reverse().map((g) => LATEST[g]), 300]
  const names = ['U', ...[...GRADES].reverse()]
  return (
    <svg viewBox={`0 0 ${W} 92`} className="gauge" role="img" aria-label={`Predicted ${Math.round(p.low)} to ${Math.round(p.high)} out of 300`}>
      {names.map((g, k) => (
        <g key={g}>
          <rect x={X(marks[k])} y={30} width={X(marks[k + 1]) - X(marks[k])} height={18} className={`band b${k}`} />
          <text x={(X(marks[k]) + X(marks[k + 1])) / 2} y={43} className="gl" textAnchor="middle">{g}</text>
        </g>
      ))}
      {GRADES.map((g) => { const [lo, hi] = boundaryRange(g); return <rect key={g} x={X(lo)} y={50} width={Math.max(2, X(hi) - X(lo))} height={4} className="yr" /> })}
      <rect x={X(p.low)} y={14} width={Math.max(3, X(p.high) - X(p.low))} height={10} rx={5} className="pred" />
      <line x1={X(p.predicted)} x2={X(p.predicted)} y1={10} y2={52} className="predline" />
      <text x={X(p.predicted)} y={9} className="gv" textAnchor="middle">{Math.round(p.predicted)}</text>
      <text x={10} y={70} className="gl2">Bands: {LATEST.series}. Grey bars: range {Math.min(...RANGE_YEARS.map((b) => b.year))}–{Math.max(...RANGE_YEARS.map((b) => b.year))}.</text>
      <text x={10} y={84} className="gl2">0</text><text x={W - 10} y={84} className="gl2" textAnchor="end">300</text>
    </svg>
  )
}

export function PaperBars({ p }: { p: Prediction }) {
  const pure = p.sections.find((s) => s.section === 'pure')!
  const rows = [
    { name: 'Paper 1 (Pure)', v: pure.predicted / 2, max: 100, sd: pure.sd / Math.SQRT2 },
    { name: 'Paper 2 (Pure)', v: pure.predicted / 2, max: 100, sd: pure.sd / Math.SQRT2 },
    ...p.sections.filter((s) => s.section !== 'pure').map((s) => ({ name: SECTION_NAME[s.section], v: s.predicted, max: s.marks, sd: s.sd })),
  ]
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.name} className="barrow">
          <span className="small">{r.name}</span>
          <div className="track"><div className="fill" style={{ width: `${(r.v / r.max) * 100}%` }} /><div className="err" style={{ left: `${(Math.max(0, r.v - 1.28 * r.sd) / r.max) * 100}%`, width: `${((2.56 * r.sd) / r.max) * 100}%` }} /></div>
          <span className="small num">{Math.round(r.v)}/{r.max}</span>
        </div>
      ))}
      <p className="muted small">Pure content can appear on either Paper 1 or Paper 2, so the Pure prediction is split evenly between them.</p>
    </div>
  )
}

const heat = (m: number) => `hsl(${Math.round(m * 130)} 60% ${28 + m * 14}%)`
export function Heatmap({ p, onPick }: { p: Prediction; onPick?: (id: string) => void }) {
  const groups: [string, string][] = [['pure', 'Pure'], ['stats', 'Statistics'], ['mech', 'Mechanics']]
  return (
    <div className="heat">
      {groups.map(([sec, name]) => (
        <div key={sec}>
          <h4>{name}</h4>
          <div className="heatgrid">
            {p.topics.filter((t) => TOPIC[t.id].section === sec).map((t) => (
              <button key={t.id} className={`hcell ${t.covered ? '' : 'off'}`} style={t.covered ? { background: heat(t.mastery) } : undefined}
                title={`${TOPIC[t.id].name}: ${t.covered ? Math.round(t.mastery * 100) + '%' : 'not started'}`} onClick={() => onPick?.(t.id)}>
                <span className="hname">{TOPIC[t.id].name}</span>
                <span className="hval">{t.covered ? `${Math.round(t.mastery * 100)}%` : 'not started'}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Trend({ hist }: { hist: Snapshot[] }) {
  if (hist.length < 2) return <p className="muted small">The trend appears after you have used the app on two different days.</p>
  const W = 340, H = 140, xs = hist.map((_, k) => 30 + (k / (hist.length - 1)) * (W - 40)), Y = (m: number) => H - 20 - (m / 300) * (H - 30)
  const band = hist.map((h, k) => `${xs[k]},${Y(h.high)}`).join(' ') + ' ' + hist.map((h, k) => `${xs[k]},${Y(h.low)}`).reverse().join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="trend" role="img" aria-label="Predicted marks over time">
      {(['A*', 'A', 'B'] as const).map((g) => <g key={g}><line x1={30} x2={W - 10} y1={Y(LATEST[g])} y2={Y(LATEST[g])} className="gridl" /><text x={26} y={Y(LATEST[g]) + 4} className="gl2" textAnchor="end">{g}</text></g>)}
      <polygon points={band} className="tband" />
      <polyline points={hist.map((h, k) => `${xs[k]},${Y(h.predicted)}`).join(' ')} className="tline" />
      <text x={30} y={H - 4} className="gl2">{hist[0].date}</text><text x={W - 10} y={H - 4} className="gl2" textAnchor="end">{hist[hist.length - 1].date}</text>
    </svg>
  )
}

/** Confidence vs accuracy. A well-calibrated student is right ~90%+ when "Sure". */
export function Calibration({ attempts }: { attempts: Attempt[] }) {
  const rows = (['guess', 'unsure', 'sure'] as const).map((c) => {
    const a = attempts.filter((x) => x.conf === c && x.kind !== 'self' && x.kind !== 'card')
    return { c, n: a.length, acc: a.length ? a.reduce((s, x) => s + (x.score >= 1 ? 1 : 0), 0) / a.length : 0 }
  })
  const target = { guess: 0.33, unsure: 0.65, sure: 0.9 }
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.c} className="barrow">
          <span className="small">{r.c === 'guess' ? 'Guess' : r.c === 'unsure' ? 'Unsure' : 'Sure'}</span>
          <div className="track"><div className="fill" style={{ width: `${r.acc * 100}%` }} /><div className="tick" style={{ left: `${target[r.c] * 100}%` }} /></div>
          <span className="small num">{r.n ? `${Math.round(r.acc * 100)}%` : '–'} <span className="muted">({r.n})</span></span>
        </div>
      ))}
      <p className="muted small">Bars show how often you were right at each confidence level; the tick is a rough calibrated target. If "Sure" is well below 90%, you are over-confident: those errors are rescheduled sooner.</p>
    </div>
  )
}

export function BoundaryTable() {
  return (
    <table className="tbl">
      <thead><tr><th>Series</th>{GRADES.map((g) => <th key={g}>{g}</th>)}</tr></thead>
      <tbody>{BOUNDARIES.map((b) => <tr key={b.series} className={b.verified ? '' : 'muted'}><td>{b.series}{b.verified ? '' : '*'}</td>{GRADES.map((g) => <td key={g}>{b[g]}</td>)}</tr>)}</tbody>
    </table>
  )
}

export const topicsByBook = () => {
  const m = new Map<string, typeof TOPICS>()
  for (const t of TOPICS) { const k = t.book.replace(/ Ch \d+$/, ''); m.set(k, [...(m.get(k) ?? []), t]) }
  return [...m.entries()]
}
