import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ENTRY, instantiate } from '../content/index'
import { TOPIC } from '../content/topics'
import { checkExpr, checkNumeric, fmtSf } from '../lib/check'
import { recordAnswer } from '../lib/record'
import { Rng } from '../lib/rng'
import type { Confidence, Item, McqItem } from '../lib/types'
import type { Slot } from '../lib/session'
import { Dia, MathInput, Pill, Tex, Timer } from './bits'

const SOURCE_LABEL = { original: 'Original quick-fire', 'exam-style': 'Exam-style (original)' } as const
const WHY_LABEL: Record<Slot['why'], string> = { review: 'Review', new: 'New', weak: 'Weakness drill', focus: 'Focus', exam: 'Exam-style', deck: 'Flashcard' }

export function targetSeconds(item: Item): number {
  if (item.t) return item.t
  if (item.type === 'card') return 15
  if (item.type === 'self') return Math.round(item.marks.length * 72) // 1.2 min per mark
  if (item.type === 'mcq' || item.type === 'method') return Math.min(90, 15 + item.diff * 12)
  return Math.min(90, 20 + item.diff * 15)
}

export function answerText(item: Item): string {
  if (item.type === 'numeric') {
    const v = item.exact ? `${+item.value.toFixed(8)}` : item.tol !== undefined ? `${+item.value.toFixed(item.tol < 0.001 ? 4 : item.tol < 0.01 ? 3 : 1)}` : fmtSf(item.value, item.sf ?? 3)
    const u = item.unit ? ' ' + item.unit.replace('ms^-2', 'm s⁻²').replace('ms^-1', 'm s⁻¹').replace('cm^2', 'cm²').replace('°', '°') : ''
    return `$${v}$${u === ' °' ? '°' : u}`
  }
  if (item.type === 'expr') return `$${item.latex}${item.addC ? ' + C' : ''}$`
  if (item.type === 'mcq' || item.type === 'method') return item.options[0]
  return ''
}

interface Props { slots: Slot[]; timer: boolean; onDone: (summary: { n: number; correct: number }) => void; title: string }

export function Player({ slots: initial, timer, onDone, title }: Props) {
  const [queue, setQueue] = useState<Slot[]>(initial)
  const [i, setI] = useState(0)
  const [seed] = useState(() => Date.now() % 1e9)
  const slot = queue[i]
  const entry = slot ? ENTRY[slot.id] : undefined
  const item = useMemo(() => (slot ? instantiate(slot.id, seed + i * 7919) : null), [slot, seed, i])
  const order = useMemo(() => (item && (item.type === 'mcq' || item.type === 'method') ? new Rng(seed + i).shuffle(item.options.map((_, k) => k)) : []), [item, seed, i])
  const [answer, setAnswer] = useState('')
  const [choice, setChoice] = useState<number | null>(null)
  const [phase, setPhase] = useState<'ask' | 'reveal'>('ask')
  const [result, setResult] = useState<{ ok: boolean; msg?: string; conf: Confidence } | null>(null)
  const [ticks, setTicks] = useState<boolean[]>([])
  const [stats, setStats] = useState({ n: 0, correct: 0 })
  const t0 = useRef(performance.now())
  const msRef = useRef(0)

  // Reset per-question state in the same update that moves to the next question (not in an effect, which would
  // run after paint and could wipe an answer typed in the first instant).
  const goTo = (k: number) => { setAnswer(''); setChoice(null); setPhase('ask'); setResult(null); setTicks([]); t0.current = performance.now(); setI(k) }
  useEffect(() => { t0.current = performance.now() }, [])

  const submit = useCallback(async (conf: Confidence) => {
    if (!item || !entry) return
    msRef.current = performance.now() - t0.current
    let ok = false, msg: string | undefined
    if (item.type === 'numeric') ({ ok, msg } = checkNumeric(answer, item))
    else if (item.type === 'expr') ({ ok, msg } = checkExpr(answer, item))
    else if (item.type === 'mcq' || item.type === 'method') ok = choice === 0
    setResult({ ok, msg, conf })
    setPhase('reveal')
    if (item.type === 'numeric' || item.type === 'expr' || item.type === 'mcq' || item.type === 'method') {
      await recordAnswer(entry, item, ok ? 1 : 0, conf, msRef.current, targetSeconds(item) * 1000)
      setStats((s) => ({ n: s.n + 1, correct: s.correct + (ok ? 1 : 0) }))
      // hypercorrection: a confident error comes back later in this session
      if (!ok && conf === 'sure') setQueue((q) => { const c = q.slice(); c.splice(Math.min(c.length, i + 4), 0, { ...slot!, why: slot!.why }); return c })
    }
  }, [item, entry, answer, choice, i, slot])

  const finishSelf = async (score: number) => {
    if (!item || !entry || !result) return
    await recordAnswer(entry, item, score, result.conf, msRef.current, targetSeconds(item) * 1000)
    setStats((s) => ({ n: s.n + 1, correct: s.correct + (score >= 0.999 ? 1 : 0) }))
    if (score < 0.6 && result.conf === 'sure') setQueue((q) => { const c = q.slice(); c.splice(Math.min(c.length, i + 4), 0, slot!); return c })
    next()
  }
  const next = () => { if (i + 1 >= queue.length) onDone(stats); else goTo(i + 1) }

  if (!slot || !item || !entry) return (
    <div className="card center"><p>Nothing to practise here yet.</p><p className="muted">Mark more topics as covered in Settings, or try another mode.</p><button className="btn" onClick={() => onDone(stats)}>Back</button></div>
  )

  const needsInput = item.type === 'numeric' || item.type === 'expr'
  const canSubmit = item.type === 'self' || item.type === 'card' || (needsInput ? answer.trim() !== '' : choice !== null)
  const topic = TOPIC[item.topic]

  return (
    <div className="player">
      <div className="ptop">
        <span className="muted small">{title} · {i + 1}/{queue.length}</span>
        <button className="link small" onClick={() => onDone(stats)}>End</button>
      </div>
      <div className="progress"><div style={{ width: `${(i / queue.length) * 100}%` }} /></div>
      {timer && <Timer seconds={targetSeconds(item)} running={phase === 'ask'} />}
      <div className="card q">
        <div className="tags">
          <Pill tone="info">{WHY_LABEL[slot.why]}</Pill>
          {entry.isGen && <Pill>Fresh variant</Pill>}
          {item.type === 'method' && <Pill tone="warn">Which method?</Pill>}
          {item.type === 'self' && <Pill tone="warn">Do it on paper</Pill>}
          <span className="muted small">{topic ? topic.name : 'General'}</span>
        </div>
        <Tex s={item.stem} block className="stem" />
        {item.diagram && <Dia d={item.diagram} />}

        {(item.type === 'mcq' || item.type === 'method') && (
          <div className="options" role="radiogroup">
            {order.map((k) => {
              const cls = phase === 'reveal' ? (k === 0 ? 'opt right' : k === choice ? 'opt wrong' : 'opt') : choice === k ? 'opt sel' : 'opt'
              return <button key={k} role="radio" aria-checked={choice === k} className={cls} disabled={phase === 'reveal'} onClick={() => setChoice(k)}><Tex s={(item as McqItem).options[k]} /></button>
            })}
          </div>
        )}
        {needsInput && phase === 'ask' && (
          item.type === 'expr'
            ? <MathInput value={answer} onChange={setAnswer} autoFocus />
            : <input className="field" inputMode="decimal" aria-label="Your answer" autoFocus value={answer} placeholder={item.type === 'numeric' && item.unit ? `Answer (${item.unit.replace('^-1', '⁻¹').replace('^-2', '⁻²').replace('^2', '²')})` : 'Answer'} onChange={(e) => setAnswer(e.target.value)} />
        )}
        {needsInput && phase === 'reveal' && <div className="youranswer muted small">Your answer: {item.type === 'expr' ? <Tex s={`$${answer}$`} /> : answer}</div>}
        {item.type === 'numeric' && phase === 'ask' && <p className="muted small">{item.exact ? 'Exact value (fractions like 5/14 are fine).' : item.tol !== undefined ? 'To the accuracy asked.' : `${item.sf ?? 3} significant figures (more accurate is fine).`}</p>}
      </div>

      {phase === 'ask' && (
        <div className="confidence">
          <p className="muted small">{item.type === 'self' ? 'Done it on paper? How confident are you?' : item.type === 'card' ? 'Say the answer in your head. How sure are you?' : 'How sure are you? (tap to submit)'}</p>
          <div className="row3">
            {(['guess', 'unsure', 'sure'] as Confidence[]).map((c) => (
              <button key={c} className={`btn conf ${c}`} disabled={!canSubmit} onClick={() => submit(c)}>{c === 'guess' ? 'Guess' : c === 'unsure' ? 'Unsure' : 'Sure'}</button>
            ))}
          </div>
        </div>
      )}

      {phase === 'reveal' && result && (
        <div className="card feedback">
          {item.type !== 'self' && item.type !== 'card' && (
            <div className={`verdict ${result.ok ? 'good' : 'bad'}`}>{result.ok ? 'Correct' : 'Not quite'}{!result.ok && result.conf === 'sure' && <span className="small"> · confident error: it will come back later in this session</span>}</div>
          )}
          {result.msg && <p className="msg">{result.msg}</p>}
          {item.type !== 'self' && item.type !== 'card' && !result.ok && <p><strong>Answer:</strong> <Tex s={answerText(item)} /></p>}
          {item.type === 'card' && <div className="cardback"><Tex s={item.solution} block /></div>}
          {item.type === 'self' ? (
            <>
              <p className="small muted">Tick each mark you earned, as an examiner would:</p>
              <ul className="marks">
                {item.marks.map((m, k) => (
                  <li key={k}><label><input type="checkbox" checked={ticks[k] ?? false} onChange={(e) => setTicks((t) => { const c = item.marks.map((_, j) => t[j] ?? false); c[k] = e.target.checked; return c })} /> <b>{m.code}</b> <Tex s={m.text} /></label></li>
                ))}
              </ul>
              <details open><summary>Full worked solution</summary><Tex s={item.solution} block className="solution" /></details>
            </>
          ) : item.type !== 'card' && <details open={!result.ok}><summary>Worked solution</summary><Tex s={item.solution} block className="solution" /></details>}
          {item.err && <p className="err"><strong>Common mistake:</strong> <Tex s={item.err} /></p>}
          <p className="muted small">{item.spec.join(', ')} · {topic?.book ?? ''} · {SOURCE_LABEL[item.source]}{item.memo === 'booklet' ? ' · in the formula booklet' : item.memo === 'memorise' ? ' · must memorise (not in booklet)' : ''}</p>
          {item.type === 'self' ? (
            <button className="btn primary wide" onClick={() => finishSelf(ticks.filter(Boolean).length / item.marks.length)}>Save {ticks.filter(Boolean).length}/{item.marks.length} marks and continue</button>
          ) : item.type === 'card' ? (
            <div className="row2">
              <button className="btn bad" onClick={async () => { await recordAnswer(entry, item, 0, result.conf, msRef.current, 15000); setStats((s) => ({ ...s, n: s.n + 1 })); next() }}>Missed it</button>
              <button className="btn good" onClick={async () => { await recordAnswer(entry, item, 1, result.conf, msRef.current, 15000); setStats((s) => ({ n: s.n + 1, correct: s.correct + 1 })); next() }}>Got it</button>
            </div>
          ) : <button className="btn primary wide" autoFocus onClick={next}>Next</button>}
        </div>
      )}
    </div>
  )
}
