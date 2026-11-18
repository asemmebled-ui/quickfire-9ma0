import katex from 'katex'

/** Split text into plain / inline-math / display-math segments. `$$..$$` display, `$..$` inline, `**..**` bold. */
export type Seg = { k: 'text' | 'bold'; s: string } | { k: 'math'; s: string; display: boolean }

export function segments(src: string): Seg[] {
  const out: Seg[] = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\*\*([^*]+?)\*\*/g
  let last = 0, m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ k: 'text', s: src.slice(last, m.index) })
    if (m[1] !== undefined) out.push({ k: 'math', s: m[1], display: true })
    else if (m[2] !== undefined) out.push({ k: 'math', s: m[2], display: false })
    else out.push({ k: 'bold', s: m[3] })
    last = re.lastIndex
  }
  if (last < src.length) out.push({ k: 'text', s: src.slice(last) })
  return out
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const cache = new Map<string, string>()

/** Render text with embedded LaTeX to an HTML string. `strict` throws on any KaTeX error (used by the render check). */
export function renderTex(src: string, strict = false): string {
  const key = (strict ? '1' : '0') + src
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const html = segments(src).map((seg) => {
    if (seg.k === 'text') return esc(seg.s)
    if (seg.k === 'bold') return `<strong>${esc(seg.s)}</strong>`
    return katex.renderToString(seg.s, { displayMode: (seg as { display: boolean }).display, throwOnError: strict, strict: strict ? 'error' : 'ignore', output: 'html' })
  }).join('')
  if (cache.size > 2000) cache.clear()
  cache.set(key, html)
  return html
}

/** Plain text that should have been LaTeX, e.g. "x^2" outside $...$. Used by the render check. */
export function looksLikeRawMaths(src: string): boolean {
  return segments(src).some((s) => s.k === 'text' && /[A-Za-z0-9)]\^[0-9{(]|\\frac|\\sqrt|_\{/.test(s.s))
}
