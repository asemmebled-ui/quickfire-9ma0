import { useEffect, useMemo, useRef, useState } from 'react'
import { renderTex } from '../lib/tex'
import { renderDiagram } from '../lib/diagrams'
import type { Diagram } from '../lib/types'

export function Tex({ s, block, className }: { s: string; block?: boolean; className?: string }) {
  const html = useMemo(() => renderTex(s), [s])
  return block ? <div className={className} dangerouslySetInnerHTML={{ __html: html }} /> : <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export function Dia({ d }: { d: Diagram }) {
  const html = useMemo(() => { try { return renderDiagram(d) } catch { return '' } }, [d])
  return html ? <div className="diagram" dangerouslySetInnerHTML={{ __html: html }} /> : null
}

let mlReady: Promise<void> | null = null
function loadMathLive() {
  if (!mlReady) mlReady = import('mathlive').then((m) => {
    const MF = m.MathfieldElement as unknown as { fontsDirectory: string | null; soundsDirectory: string | null }
    MF.fontsDirectory = new URL('mathlive-fonts/', document.baseURI).href
    MF.soundsDirectory = null
  })
  return mlReady
}

/** Algebraic input: MathLive maths keyboard, with a plain-text fallback. */
export function MathInput({ value, onChange, onEnter, autoFocus }: { value: string; onChange: (v: string) => void; onEnter?: () => void; autoFocus?: boolean }) {
  const [ready, setReady] = useState(false)
  const [plain, setPlain] = useState(() => { try { return localStorage.getItem('qf-plain') === '1' } catch { return false } })
  const ref = useRef<HTMLElement & { value: string }>(null)
  useEffect(() => { if (!plain) loadMathLive().then(() => setReady(true)).catch(() => setPlain(true)) }, [plain])
  useEffect(() => {
    const el = ref.current
    if (!el || plain || !ready) return
    const onInput = () => onChange(el.value)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.() } }
    el.addEventListener('input', onInput)
    el.addEventListener('keydown', onKey)
    if (autoFocus) setTimeout(() => el.focus(), 30)
    return () => { el.removeEventListener('input', onInput); el.removeEventListener('keydown', onKey) }
  }, [ready, plain, onChange, onEnter, autoFocus])
  const toggle = () => { const v = !plain; setPlain(v); onChange(''); try { localStorage.setItem('qf-plain', v ? '1' : '0') } catch { /* ignore */ } }
  return (
    <div className="mathinput">
      {plain ? (
        <input className="field" aria-label="Your answer" value={value} placeholder="e.g. 3x^2 + 2/x" autoFocus={autoFocus} autoCapitalize="off" autoCorrect="off" spellCheck={false}
          onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onEnter?.() }} />
      ) : ready ? (
        <math-field ref={ref} class="field mf" aria-label="Your answer" math-virtual-keyboard-policy="auto" smart-fence="on"></math-field>
      ) : <div className="field muted">Loading maths keyboard…</div>}
      <button type="button" className="link small" onClick={toggle}>{plain ? 'Use maths keyboard' : 'Type as plain text'}</button>
    </div>
  )
}

export function Timer({ seconds, running, onTick }: { seconds: number; running: boolean; onTick?: (ms: number) => void }) {
  const start = useRef(performance.now())
  const [ms, setMs] = useState(0)
  useEffect(() => { start.current = performance.now(); setMs(0) }, [seconds])
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => { const v = performance.now() - start.current; setMs(v); onTick?.(v) }, 200)
    return () => clearInterval(id)
  }, [running, onTick])
  const frac = Math.min(1, ms / (seconds * 1000))
  const left = Math.max(0, Math.ceil(seconds - ms / 1000))
  return (
    <div className="timer" role="timer" aria-label={`${left} seconds left`}>
      <div className={`bar ${frac >= 1 ? 'over' : frac > 0.75 ? 'late' : ''}`} style={{ transform: `scaleX(${1 - frac})` }} />
      <span>{frac >= 1 ? 'Over time' : `${left}s`}</span>
    </div>
  )
}

export function Pill({ children, tone }: { children: React.ReactNode; tone?: 'good' | 'bad' | 'warn' | 'info' }) {
  return <span className={`pill ${tone ?? ''}`}>{children}</span>
}
