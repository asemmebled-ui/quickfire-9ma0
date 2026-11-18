import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react'
import { BANK, BANK_SIZE, DECKS } from '../content/index'
import { TOPIC, TOPICS } from '../content/topics'
import { LATEST } from '../content/boundaries'
import { PAPERS, PAPER, PEARSON_SEARCH } from '../content/papers'
import { db, exportBackup, importBackup, loadSettings, saveSettings, wipeAll, DEFAULT_SETTINGS, type Settings, type StoredCard } from '../lib/db'
import { dailyTarget, predict, K, type ModelInput } from '../lib/model'
import { deckSession, examStyle, quickfire, todayPlan, weaknessSession, WEAKNESS_NAME, weakestWeakness, type Slot } from '../lib/session'
import type { Attempt, PaperLog, Weakness } from '../lib/types'
import { Player } from './Player'
import { BoundaryTable, Calibration, Gauge, Heatmap, PaperBars, Trend, topicsByBook, type Snapshot } from './Dashboard'
import { Pill } from './bits'

type Tab = 'today' | 'practise' | 'decks' | 'progress' | 'papers' | 'settings' | 'how'
interface Data { cards: StoredCard[]; attempts: Attempt[]; papers: PaperLog[]; settings: Settings; hist: Snapshot[] }

const DAY = 86400000
const daysTo = (d: string) => Math.ceil((new Date(d + 'T13:30:00').getTime() - Date.now()) / DAY)

export function App() {
  const [tab, setTab] = useState<Tab>(() => { const h = location.hash.slice(1); return (h === 'more' ? 'settings' : (h as Tab)) || 'today' })
  const [data, setData] = useState<Data | null>(null)
  const [run, setRun] = useState<{ slots: Slot[]; title: string } | null>(null)
  const [toast, setToast] = useState('')

  const refresh = useCallback(async () => {
    const [cards, attempts, papers, settings, h] = await Promise.all([db.cards.toArray(), db.attempts.toArray(), db.papers.toArray(), loadSettings(), db.kv.get('history')])
    setData({ cards, attempts, papers, settings, hist: (h?.value as Snapshot[]) ?? [] })
  }, [])
  useEffect(() => { refresh() }, [refresh])
  useEffect(() => { location.hash = tab === 'today' ? '' : tab === 'settings' ? 'more' : tab; window.scrollTo(0, 0) }, [tab])
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 3500); return () => clearTimeout(id) } }, [toast])

  const input: ModelInput | null = useMemo(() => data && { now: Date.now(), covered: data.settings.covered, cards: data.cards, attempts: data.attempts, papers: data.papers, bankSize: BANK_SIZE }, [data])
  const pred = useMemo(() => (input ? predict(input) : null), [input])

  // daily snapshot for the trend chart
  useEffect(() => {
    if (!pred || !data || data.attempts.length + data.papers.length === 0) return
    const today = new Date().toISOString().slice(0, 10)
    const snap: Snapshot = { date: today, predicted: pred.predicted, low: pred.low, high: pred.high, readiness: pred.readiness }
    const hist = [...data.hist.filter((h) => h.date !== today), snap].slice(-365)
    db.kv.put({ key: 'history', value: hist })
  }, [pred, data])

  // Each screen gets a component identity that never changes, so re-rendering the app (after a save, a toast or a
  // data refresh) updates a screen in place instead of re-creating it and losing what you typed or opened.
  // The latest version of each screen function is read from impl.current on every render.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const impl = useRef<Record<string, (p: any) => ReactElement>>({})
  const V = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mk = (k: string) => { const C = (p: any) => impl.current[k](p); C.displayName = k; return C }
    return { Today: mk('Today'), Practise: mk('Practise'), Decks: mk('Decks'), Progress: mk('Progress'), Papers: mk('Papers'), SettingsView: mk('SettingsView'), How: mk('How'), LogPaper: mk('LogPaper') }
  }, [])

  if (!data || !pred || !input) return <div className="boot">Loading…</div>
  const s = data.settings
  document.documentElement.dataset.theme = s.theme
  const sessionInput = { bank: BANK, cards: data.cards, attempts: data.attempts, papers: data.papers, covered: s.covered, now: Date.now(), seed: Date.now() % 1e9 }
  const start = (slots: Slot[], title: string) => { if (!slots.length) { setToast('Nothing to practise in that mode yet. Cover more topics in Settings.'); return } setRun({ slots, title }) }
  const save = async (patch: Partial<Settings>) => { await saveSettings({ ...s, ...patch }); await refresh() }

  if (run) return (
    <main className="app"><Player slots={run.slots} title={run.title} timer={s.timer} onDone={async (r) => { setRun(null); await refresh(); if (r.n) setToast(`Session done: ${r.correct}/${r.n} right first time.`) }} /></main>
  )

  const target = dailyTarget(input, s.exams.P1, s.minutes)
  impl.current = { Today, Practise, Decks, Progress, Papers, SettingsView, How, LogPaper }

  return (
    <>
      <main className="app">
        {tab === 'today' && <V.Today />}
        {tab === 'practise' && <V.Practise />}
        {tab === 'decks' && <V.Decks />}
        {tab === 'progress' && <V.Progress />}
        {tab === 'papers' && <V.Papers />}
        {tab === 'settings' && <V.SettingsView />}
        {tab === 'how' && <V.How />}
      </main>
      {toast && <div className="toast" role="status">{toast}</div>}
      <nav className="tabs">
        {([['today', 'Today', '◎'], ['practise', 'Practise', '⚡'], ['decks', 'Decks', '▤'], ['progress', 'Progress', '◔'], ['papers', 'Papers', '✎'], ['settings', 'More', '⋯']] as [Tab, string, string][]).map(([t, l, ic]) => (
          <button key={t} className={tab === t || (t === 'settings' && tab === 'how') ? 'on' : ''} onClick={() => setTab(t)} aria-label={l}><span className="ic" aria-hidden>{ic}</span>{l}</button>
        ))}
      </nav>
    </>
  )

  function Countdown() {
    const rows = [['Paper 1', s.exams.P1], ['Paper 2', s.exams.P2], ['Paper 3', s.exams.P3]] as const
    return <div className="count">{rows.map(([n, d]) => <div key={n}><b>{Math.max(0, daysTo(d))}</b><span>days to {n}</span></div>)}</div>
  }

  function Today() {
    const plan = todayPlan(sessionInput, target.reviews, target.newItems)
    const w = weakestWeakness(BANK, data!.attempts)
    return (
      <>
        <header className="hero">
          <div><h1>Today</h1><p className="muted small">{s.streak > 0 ? `${s.streak}-day streak · ` : ''}{s.xp} XP</p></div>
          <button className="gradechip" onClick={() => setTab('progress')}><span>{pred!.grade}</span><small>{Math.round(pred!.low)}–{Math.round(pred!.high)}</small></button>
        </header>
        <Countdown />
        <section className="card">
          <h2>Your session</h2>
          <ul className="plan">
            <li><b>{plan.filter((x) => x.why === 'review').length}</b> reviews due (spaced repetition)</li>
            <li><b>{plan.filter((x) => x.why === 'new').length}</b> new items from topics you've covered</li>
            <li><b>1</b> weakness drill: {WEAKNESS_NAME[w]}</li>
          </ul>
          <p className="muted small">About {s.minutes} minutes. To be on track: {target.reviews} reviews + {target.newItems} new items a day until Paper 1 ({target.daysLeft} days).</p>
          <button className="btn primary wide big" onClick={() => start(plan, 'Today')}>Start today's session</button>
        </section>
        {pred!.capped && <section className="card warn"><b>Readiness is capped at {K.readinessCapNoPaper}.</b> No full timed past paper logged yet. Real timed papers are the strongest evidence. <button className="link" onClick={() => setTab('papers')}>Log a paper</button></section>}
        <section className="card">
          <h2>Best value next</h2>
          <p className="muted small">Topics where revision should gain the most marks per hour (weight × gap × ease).</p>
          <ol className="best">{pred!.best.slice(0, 4).map((b) => <li key={b.id}><button className="link" onClick={() => start(quickfire(sessionInput, 10, b.id), TOPIC[b.id].name)}>{TOPIC[b.id].name}</button> <span className="muted small">≈{b.gain.toFixed(1)} marks available</span></li>)}</ol>
        </section>
      </>
    )
  }

  function Practise() {
    const [focus, setFocus] = useState(s.covered[0] ?? '')
    return (
      <>
        <h1>Practise</h1>
        <section className="card">
          <h2>Interleaved quick-fire</h2>
          <p className="muted small">Mixed questions from every topic you've covered. Mixing makes you choose the method, which is the exam skill (Rohrer et al., 2020).</p>
          <div className="row2"><button className="btn primary" onClick={() => start(quickfire(sessionInput, 15), 'Quick-fire')}>15 questions</button><button className="btn" onClick={() => start(quickfire(sessionInput, 30), 'Quick-fire')}>30 questions</button></div>
        </section>
        <section className="card">
          <h2>Exam-style (original)</h2>
          <p className="muted small">Harder and self-marked questions, weighted towards high-mark topics and those that have come up less in the papers you've logged. <b>Nobody can predict the paper</b>: this is coverage-gap weighting, not a prediction.</p>
          <button className="btn wide" onClick={() => start(examStyle(sessionInput, 10), 'Exam-style')}>10 exam-style questions</button>
        </section>
        <section className="card">
          <h2>Weakness drills</h2>
          {(['const', 'logdomain', 'vecunits'] as Weakness[]).map((w) => <button key={w} className="btn wide left" onClick={() => start(weaknessSession(sessionInput, w, 10), WEAKNESS_NAME[w])}>{WEAKNESS_NAME[w]}</button>)}
        </section>
        <section className="card">
          <h2>Focus on one topic</h2>
          <p className="muted small">Useful straight after learning a topic. Not the default: blocked practice feels easier but sticks less.</p>
          <select className="field" value={focus} onChange={(e) => setFocus(e.target.value)} aria-label="Topic">
            {TOPICS.filter((t) => s.covered.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.book} · {t.name}</option>)}
          </select>
          <button className="btn wide" disabled={!focus} onClick={() => start(quickfire(sessionInput, 12, focus), TOPIC[focus]?.name ?? '')}>Practise this topic</button>
        </section>
      </>
    )
  }

  function Decks() {
    const cardMap = new Map(data!.cards.map((c) => [c.id, c]))
    return (
      <>
        <h1>Memorise</h1>
        <p className="muted small">Flashcards for things you must know by heart. The "not in booklet" deck was checked against the official Pearson formulae booklet: everything in it is NOT given in the exam.</p>
        {DECKS.map((d) => {
          const cs = BANK.filter((e) => e.deck === d.id)
          const seen = cs.filter((e) => (cardMap.get(e.id)?.seen ?? 0) > 0).length
          const due = cs.filter((e) => { const c = cardMap.get(e.id); return c && c.seen > 0 && new Date(c.fsrs.due).getTime() <= Date.now() }).length
          return (
            <section key={d.id} className="card deck">
              <div><h2>{d.name}</h2><p className="muted small">{d.blurb}</p><p className="small">{seen}/{cs.length} learned{due ? <> · <b>{due} due</b></> : ''}</p></div>
              <button className="btn primary" onClick={() => start(deckSession(sessionInput, d.id, 10), d.name)}>Study</button>
            </section>
          )
        })}
      </>
    )
  }

  function Progress() {
    const p = pred!
    return (
      <>
        <h1>Progress</h1>
        <section className="card">
          <p className="summary">{p.summary}.</p>
          <Gauge p={p} />
          {p.next && <p className="small">About <b>{p.next.marks}</b> more marks (out of 300) for {p.next.grade} on the {LATEST.series} boundaries.</p>}
          <p className="muted small">Boundaries change every year (A* has ranged from 217 to 258 since 2022). The range shown is roughly an 80% interval. <button className="link" onClick={() => setTab('how')}>How is this calculated?</button></p>
        </section>
        <section className="card">
          <h2>Readiness {Math.round(p.readiness)}/100{p.capped && <Pill tone="warn">capped: no timed paper</Pill>}</h2>
          <div className="bars">
            {([['Spec covered', p.parts.coverage], ['Not overdue', p.parts.retention], ['Predicted vs A*', p.parts.predicted], ['Timed papers', p.parts.exam]] as [string, number][]).map(([n, v]) => (
              <div key={n} className="barrow"><span className="small">{n}</span><div className="track"><div className="fill" style={{ width: `${v * 100}%` }} /></div><span className="small num">{Math.round(v * 100)}%</span></div>
            ))}
          </div>
        </section>
        <section className="card"><h2>By paper</h2><PaperBars p={p} /></section>
        <section className="card"><h2>Biggest gains per hour</h2><ol className="best">{p.best.map((b) => <li key={b.id}>{TOPIC[b.id].name} <span className="muted small">≈{b.gain.toFixed(1)} marks · mastery {Math.round((p.topics.find((t) => t.id === b.id)?.mastery ?? 0) * 100)}%</span></li>)}</ol></section>
        <section className="card"><h2>Topic mastery</h2><p className="muted small">Grey = not started (not a weakness). Tap a topic to drill it.</p><Heatmap p={p} onPick={(id) => p.topics.find((t) => t.id === id)?.covered && start(quickfire(sessionInput, 10, id), TOPIC[id].name)} /></section>
        <section className="card"><h2>Trend</h2><Trend hist={data!.hist} /></section>
        <section className="card"><h2>Calibration</h2><Calibration attempts={data!.attempts} /></section>
      </>
    )
  }

  function Papers() {
    const [logging, setLogging] = useState<string | null>(null)
    const pdfs = useMemo(() => db.pdfs.toArray(), [])
    const [pdfList, setPdfList] = useState<{ id: string; name: string }[]>([])
    useEffect(() => { pdfs.then((x) => setPdfList(x.map(({ id, name }) => ({ id, name })))) }, [pdfs])
    if (logging) return <V.LogPaper paperId={logging} onClose={async () => { setLogging(null); await refresh() }} />
    const logged = new Map<string, PaperLog[]>()
    for (const l of data!.papers) logged.set(l.paperId, [...(logged.get(l.paperId) ?? []), l])
    const series = [...new Set(PAPERS.map((p) => p.series))].reverse()
    return (
      <>
        <h1>Past papers</h1>
        <p className="muted small">An index only: Pearson's papers are copyrighted, so no questions are copied into the app. Download them from Pearson, do them on paper under timed conditions (2 hours each), then log your marks here. <b>Logged timed papers count most</b> towards your prediction.</p>
        <a className="btn wide" href={PEARSON_SEARCH} target="_blank" rel="noopener">Open Pearson past papers (9MA0)</a>
        {series.map((se) => (
          <section key={se} className="card">
            <h2>{se}</h2>
            {PAPERS.filter((p) => p.series === se).map((p) => (
              <div key={p.id} className="paperrow">
                <div><b>{p.paper}</b> <span className="small muted">{p.code}</span>{p.note && <div className="small muted">{p.note}</div>}
                  {(logged.get(p.id) ?? []).map((l) => { const g = l.questions.reduce((a, q) => a + q.got, 0), m = l.questions.reduce((a, q) => a + q.max, 0); return <div key={l.id} className="small">Logged {new Date(l.date).toLocaleDateString()}: <b>{g}/{m}</b>{l.timed ? ' timed' : ' untimed'}</div> })}
                </div>
                <div className="paperbtns">{p.url && <a className="link small" href={p.url} target="_blank" rel="noopener">PDF</a>}<button className="btn small" onClick={() => setLogging(p.id)}>Log</button></div>
              </div>
            ))}
          </section>
        ))}
        <section className="card"><h2>Other paper or mock</h2><button className="btn wide" onClick={() => setLogging('custom')}>Log a different paper</button></section>
        <section className="card">
          <h2>Your own PDFs (stored on this device only)</h2>
          <p className="muted small">For personal use: add a paper you downloaded yourself to read it inside the app offline. It is never uploaded anywhere and is not included in backups.</p>
          <input type="file" accept="application/pdf" aria-label="Add a PDF" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const id = `${Date.now()}`; await db.pdfs.put({ id, name: f.name, blob: f }); setPdfList((l) => [...l, { id, name: f.name }]) }} />
          <ul className="pdfs">{pdfList.map((x) => <li key={x.id}><button className="link" onClick={async () => { const r = await db.pdfs.get(x.id); if (r) { const u = URL.createObjectURL(r.blob); if (!window.open(u, '_blank')) { const a = document.createElement('a'); a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.click() } } }}>{x.name}</button> <button className="link small bad" onClick={async () => { await db.pdfs.delete(x.id); setPdfList((l) => l.filter((y) => y.id !== x.id)) }}>remove</button></li>)}</ul>
        </section>
      </>
    )
  }

  function LogPaper({ paperId, onClose }: { paperId: string; onClose: () => void }) {
    const ref = PAPER[paperId]
    const [section, setSection] = useState<'P1' | 'P2' | 'P3'>(ref?.paper ?? 'P1')
    const [timed, setTimed] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
    const [rows, setRows] = useState(() => Array.from({ length: 12 }, (_, k) => ({ n: String(k + 1), got: '', max: '', topic: '' })))
    const topicOpts = TOPICS.filter((t) => (section === 'P3' ? t.section !== 'pure' : t.section === 'pure'))
    const filled = rows.filter((r) => r.max !== '')
    const total = filled.reduce((a, r) => a + (+r.max || 0), 0), got = filled.reduce((a, r) => a + (+r.got || 0), 0)
    const valid = filled.length > 0 && filled.every((r) => +r.got >= 0 && +r.max > 0 && +r.got <= +r.max)
    const submit = async () => {
      await db.papers.add({ date: new Date(date + 'T12:00:00').getTime(), paperId, section, timed, full: total >= 90, questions: filled.map((r) => ({ n: r.n, got: +r.got, max: +r.max, topics: r.topic ? [r.topic] : [] })) })
      setToast(`Logged ${got}/${total}.`); onClose()
    }
    return (
      <>
        <button className="link" onClick={onClose}>← Back</button>
        <h1>Log {ref ? `${ref.series} ${ref.paper}` : 'a paper'}</h1>
        <section className="card">
          <div className="row2">
            <label className="small">Paper<select className="field" value={section} onChange={(e) => setSection(e.target.value as 'P1')} disabled={!!ref}><option value="P1">Paper 1</option><option value="P2">Paper 2</option><option value="P3">Paper 3</option></select></label>
            <label className="small">Date sat<input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          </div>
          <label className="check"><input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} /> Done under timed exam conditions (2 hours, no notes)</label>
          <p className="muted small">Enter the mark per question from the mark scheme. Tag each question's main topic so the app can update topic mastery. Totals of 90+ count as a full paper.</p>
          <div className="qrows">
            <div className="qrow head small muted"><span>Q</span><span>Got</span><span>Max</span><span>Main topic</span></div>
            {rows.map((r, k) => (
              <div key={k} className="qrow">
                <input className="field" aria-label={`Question ${k + 1} number`} value={r.n} onChange={(e) => setRows(rows.map((x, j) => (j === k ? { ...x, n: e.target.value } : x)))} />
                <input className="field" inputMode="numeric" aria-label={`Question ${k + 1} marks got`} value={r.got} onChange={(e) => setRows(rows.map((x, j) => (j === k ? { ...x, got: e.target.value } : x)))} />
                <input className="field" inputMode="numeric" aria-label={`Question ${k + 1} max marks`} value={r.max} onChange={(e) => setRows(rows.map((x, j) => (j === k ? { ...x, max: e.target.value } : x)))} />
                <select className="field" aria-label={`Question ${k + 1} topic`} value={r.topic} onChange={(e) => setRows(rows.map((x, j) => (j === k ? { ...x, topic: e.target.value } : x)))}><option value="">—</option>{topicOpts.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              </div>
            ))}
          </div>
          <button className="link" onClick={() => setRows([...rows, { n: String(rows.length + 1), got: '', max: '', topic: '' }])}>+ Add question</button>
          <p><b>Total: {got}/{total}</b></p>
          <button className="btn primary wide" disabled={!valid} onClick={submit}>Save paper</button>
        </section>
      </>
    )
  }

  function SettingsView() {
    const [msg, setMsg] = useState('')
    const [pending, setPending] = useState<string | null>(null)
    const [pasteText, setPasteText] = useState('')
    const [wipeAsk, setWipeAsk] = useState(false)
    void setMsg
    const covered = new Set(s.covered)
    const toggle = (id: string) => save({ covered: covered.has(id) ? s.covered.filter((x) => x !== id) : [...s.covered, id] })
    return (
      <>
        <h1>Settings</h1>
        <section className="card">
          <h2>Topics I've covered</h2>
          <p className="muted small">Only covered topics are quizzed. Uncovered topics show as "not started", not as weak.</p>
          {topicsByBook().map(([book, ts]) => (
            <details key={book} open={book.startsWith('Pure Y2') || book.startsWith('Stats')}>
              <summary>{book} <span className="muted small">({ts.filter((t) => covered.has(t.id)).length}/{ts.length})</span></summary>
              <div className="row2"><button className="link small" onClick={() => save({ covered: [...new Set([...s.covered, ...ts.map((t) => t.id)])] })}>All</button><button className="link small" onClick={() => save({ covered: s.covered.filter((x) => !ts.some((t) => t.id === x)) })}>None</button></div>
              {ts.map((t) => <label key={t.id} className="check"><input type="checkbox" checked={covered.has(t.id)} onChange={() => toggle(t.id)} /> {t.book.replace(/^.* Ch /, 'Ch ')}: {t.name}</label>)}
            </details>
          ))}
        </section>
        <section className="card">
          <h2>Sessions</h2>
          <label className="small">Daily minutes: <b>{s.minutes}</b><input type="range" min={5} max={60} step={5} value={s.minutes} onChange={(e) => save({ minutes: +e.target.value })} /></label>
          <label className="check"><input type="checkbox" checked={s.timer} onChange={(e) => save({ timer: e.target.checked })} /> Show the question timer</label>
          <label className="check"><input type="checkbox" checked={s.theme === 'light'} onChange={(e) => save({ theme: e.target.checked ? 'light' : 'dark' })} /> Light theme</label>
        </section>
        <section className="card">
          <h2>Exam dates</h2>
          <p className="muted small">Pre-filled from Pearson's final summer 2027 timetable (all afternoon). Check with your exam centre.</p>
          {(['P1', 'P2', 'P3'] as const).map((k) => <label key={k} className="small">Paper {k[1]}<input className="field" type="date" value={s.exams[k]} onChange={(e) => save({ exams: { ...s.exams, [k]: e.target.value } })} /></label>)}
        </section>
        <section className="card">
          <h2>Backup</h2>
          <p className="muted small">Everything is stored only on this device. Make a backup to move between phone and laptop: download a file, or copy the backup text and paste it on the other device.</p>
          <div className="row2">
            <button className="btn" onClick={async () => { const b = await exportBackup(); const url = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `quickfire-9ma0-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); setToast('Backup file downloading.') }}>Download backup</button>
            <button className="btn" onClick={async () => { const text = JSON.stringify(await exportBackup()); try { await navigator.clipboard.writeText(text); setToast('Backup copied. Paste it into "Restore" on your other device.') } catch { setPasteText(text); setToast('Copy the text in the box below.') } }}>Copy backup</button>
          </div>
          <label className="btn wide">Restore from a file<input id="restore-file" type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPending(await f.text()); e.target.value = '' }} /></label>
          <details>
            <summary>Restore from pasted text</summary>
            <textarea id="restore-text" className="field" rows={4} aria-label="Backup text" value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste backup text here" />
            <button className="btn wide" disabled={!pasteText.trim()} onClick={() => setPending(pasteText)}>Restore from this text</button>
          </details>
          {pending !== null && (
            <div className="card warn" role="alertdialog" aria-label="Confirm restore">
              <p><b>Replace all data on this device with this backup?</b> Your current progress here will be overwritten.</p>
              <div className="row2">
                <button className="btn" onClick={() => setPending(null)}>Cancel</button>
                <button className="btn primary" onClick={async () => { try { const r = await importBackup(JSON.parse(pending)); setPending(null); setPasteText(''); setToast(`Restored ${r.cards} cards, ${r.attempts} answers and ${r.papers} papers.`); await refresh() } catch (err) { setPending(null); setToast(err instanceof SyntaxError ? 'That is not valid backup text. Copy the whole backup and try again.' : (err as Error).message) } }}>Replace my data</button>
              </div>
            </div>
          )}
          {msg && <p className="small" role="status">{msg}</p>}
          {wipeAsk ? (
            <div className="card warn" role="alertdialog" aria-label="Confirm reset">
              <p><b>Delete all progress on this device?</b> This cannot be undone unless you have a backup.</p>
              <div className="row2">
                <button className="btn" onClick={() => setWipeAsk(false)}>Cancel</button>
                <button className="btn bad" onClick={async () => { await wipeAll(); await saveSettings(DEFAULT_SETTINGS); setWipeAsk(false); await refresh() }}>Delete everything</button>
              </div>
            </div>
          ) : <button className="link small bad" onClick={() => setWipeAsk(true)}>Reset all data</button>}
        </section>
        <section className="card">
          <h2>About</h2>
          <button className="btn wide" onClick={() => setTab('how')}>How is the prediction calculated?</button>
          <p className="muted small">Question sources are labelled on every question: "Original quick-fire" and "Exam-style (original)" are written for this app and machine-checked. Past papers are indexed only. {BANK.length} cards in the bank.</p>
        </section>
      </>
    )
  }

  function How() {
    return (
      <>
        <button className="link" onClick={() => setTab('settings')}>← Back</button>
        <h1>How is this calculated?</h1>
        <section className="card prose">
          <h2>1. How many marks each topic is worth</h2>
          <p>Each textbook chapter gets an estimated share of the 300 marks: Pure 200, Statistics 50, Mechanics 50. These are judgement-based starting weights, not published Pearson figures.</p>
          <h2>2. How well you know each topic (mastery, 0–100%)</h2>
          <p>Mastery is an average of the evidence, pulled towards a cautious starting guess of {K.priorMastery * 100}%, so a topic you've barely practised can't look mastered:</p>
          <ul>
            <li><b>Memory now</b>: the spaced-repetition model (FSRS-6) estimates the chance you'd still recall each item today. Weak evidence: {K.recallN} per item seen.</li>
            <li><b>Exam-style questions</b>: your recent scores on harder and self-marked questions, counted three times as strongly ({K.examN} each), with older ones fading (half-life {K.examHalfLife} days).</li>
            <li><b>Logged past papers</b>: marks on questions you tagged to the topic count most ({K.paperN} per mark), fading with a {K.paperHalfLife}-day half-life. Untimed papers count half.</li>
            <li><b>Over-confidence</b>: if you often answer "Sure" and are wrong, mastery is reduced by up to {K.hcePenalty * 100}%.</li>
          </ul>
          <h2>3. Predicted score</h2>
          <p>Each topic's marks × its mastery, added up, then multiplied by {K.transfer} because doing well on short questions overstates exam marks. Once you log full papers, the app blends this estimate with your real paper scores (timed papers count double), and the real papers take over as you log more.</p>
          <h2>4. The range</h2>
          <p>The range is roughly an 80% interval. It is wide (about ±{Math.round((K.uMin + K.uExtra) * 100)}% of the marks) until you log timed papers, then narrows. It is mapped to the {LATEST.series} boundaries, with the range across recent years shown as well:</p>
          <BoundaryTable />
          <p className="muted small">* not checked against Pearson's own document. 2022 was deliberately graded generously after the pandemic.</p>
          <h2>5. Readiness (0–100)</h2>
          <p>25% spec coverage + 15% reviews not overdue + 30% predicted score compared with the A* boundary + 30% recent timed-paper performance. With no full timed paper logged it is capped at {K.readinessCapNoPaper}. Quick-fire stats alone can never make you look "ready".</p>
          <h2>6. Best topics to revise</h2>
          <p>Topic marks × (1 − mastery) × how quickly that topic usually improves with practice.</p>
          <h2>What the app can't know</h2>
          <p>It cannot predict the paper, the boundaries, or how you'll perform on the day. Treat the numbers as a guide that gets more trustworthy with every timed paper you log.</p>
        </section>
      </>
    )
  }
}
