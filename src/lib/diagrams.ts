/** Diagram spec -> SVG string. Pure functions so every diagram can be render-checked in Node. */
import type { Diagram } from './types'
import { parse } from './mathparse'

const W = 320, H = 200
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const n = (x: number) => +x.toFixed(1)
const line = (x1: number, y1: number, x2: number, y2: number, cls = 's') => `<line class="${cls}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`
const text = (x: number, y: number, s: string, anchor = 'middle', cls = 't') => `<text class="${cls}" x="${n(x)}" y="${n(y)}" text-anchor="${anchor}">${esc(s)}</text>`
function arrow(x1: number, y1: number, x2: number, y2: number, label = '', cls = 'f'): string {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8
  const p = (d: number) => `${n(x2 - h * Math.cos(a + d))},${n(y2 - h * Math.sin(a + d))}`
  const lx = x2 + 12 * Math.cos(a), ly = y2 + 12 * Math.sin(a) + 4
  return line(x1, y1, x2, y2, cls) + `<polygon class="${cls}h" points="${n(x2)},${n(y2)} ${p(0.4)} ${p(-0.4)}"/>` + (label ? text(lx, ly, label, 'middle', 'tl') : '')
}
const wrap = (body: string, label: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" class="dia">${body}</svg>`

function graph(d: Extract<Diagram, { k: 'graph' }>): string {
  const [x0, x1] = d.x, [y0, y1] = d.y, m = 14
  const X = (x: number) => m + ((x - x0) / (x1 - x0)) * (W - 2 * m), Y = (y: number) => H - m - ((y - y0) / (y1 - y0)) * (H - 2 * m)
  let out = ''
  const fns = d.fns.map((f) => parse(f).fn)
  if (d.shade) {
    const [a, b] = d.shade, pts: string[] = [`${n(X(a))},${n(Y(0))}`]
    for (let i = 0; i <= 60; i++) { const x = a + ((b - a) * i) / 60; pts.push(`${n(X(x))},${n(Y(fns[0]({ x })))}`) }
    pts.push(`${n(X(b))},${n(Y(0))}`)
    out += `<polygon class="shade" points="${pts.join(' ')}"/>`
  }
  if (y0 <= 0 && y1 >= 0) out += line(X(x0), Y(0), X(x1), Y(0), 'ax') + text(X(x1) - 4, Y(0) - 5, 'x', 'end', 'ti')
  if (x0 <= 0 && x1 >= 0) out += line(X(0), Y(y0), X(0), Y(y1), 'ax') + text(X(0) + 6, Y(y1) + 10, 'y', 'start', 'ti') + text(X(0) - 5, Y(0) + 12, 'O', 'end', 'ti')
  fns.forEach((f, idx) => {
    let path = '', pen = false
    for (let i = 0; i <= 160; i++) {
      const x = x0 + ((x1 - x0) * i) / 160, y = f({ x })
      if (!Number.isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { pen = false; continue }
      path += `${pen ? 'L' : 'M'}${n(X(x))} ${n(Math.max(-20, Math.min(H + 20, Y(y))))}`
      pen = true
    }
    out += `<path class="c${idx % 2}" d="${path}"/>`
  })
  for (const v of d.vlines ?? []) out += line(X(v), Y(y0), X(v), Y(y1), 'dash')
  for (const [px, py, lab] of d.pts ?? []) out += `<circle class="pt" cx="${n(X(px))}" cy="${n(Y(py))}" r="3"/>` + (lab ? text(X(px) + 6, Y(py) - 6, lab, 'start') : '')
  return out
}

function incline(d: Extract<Diagram, { k: 'incline' }>): string {
  const a = (d.angle * Math.PI) / 180, bx = 40, by = 170, len = 230
  const tx = bx + len * Math.cos(a), ty = by - len * Math.sin(a)
  let out = `<polygon class="s" points="${bx},${by} ${n(tx)},${by} ${n(tx)},${n(ty)}"/>` + text(bx + 46, by - 5, `${d.angle}°`, 'start', 'ti')
  if (d.rough) out += text(bx + 120, by + 16, 'rough', 'middle', 'ti')
  const cx = bx + 0.55 * len * Math.cos(a), cy = by - 0.55 * len * Math.sin(a) - 9 * Math.cos(a) + 0
  const px = cx - 9 * Math.sin(a), py = cy - 2
  out += `<rect class="blk" x="${n(px - 12)}" y="${n(py - 12)}" width="24" height="24" transform="rotate(${-d.angle} ${n(px)} ${n(py)})"/>`
  const L = 55
  for (const f of d.forces) {
    let dx = 0, dy = 0
    if (f.dir === 'normal') { dx = -Math.sin(a); dy = -Math.cos(a) }
    else if (f.dir === 'weight') { dx = 0; dy = 1 }
    else if (f.dir === 'up') { dx = Math.cos(a); dy = -Math.sin(a) }
    else if (f.dir === 'down') { dx = -Math.cos(a); dy = Math.sin(a) }
    else { dx = 1; dy = 0 }
    if (f.dir === 'horiz') out += arrow(px - L - 14, py, px - 14, py, '', 'f') + text(px - L - 22, py + 4, f.label, 'end', 'tl')
    else out += arrow(px, py, px + L * dx, py + L * dy, f.label)
  }
  return out
}

function forces(d: Extract<Diagram, { k: 'forces' }>): string {
  const cx = W / 2, cy = H / 2 + 10
  let out = d.forces.length === 1 ? line(cx - 10, cy, cx + 110, cy, 'dash') : ''
  out += `<circle class="pt" cx="${cx}" cy="${cy}" r="4"/>`
  for (const f of d.forces) { const a = (f.deg * Math.PI) / 180; out += arrow(cx, cy, cx + 70 * Math.cos(a), cy - 70 * Math.sin(a), f.label) }
  if (d.forces.length === 1) out += text(cx + 34, cy - 6, `${d.forces[0].deg}°`, 'start', 'ti')
  return out
}

function projectile(d: Extract<Diagram, { k: 'projectile' }>): string {
  const gy = 175, a = (d.angle * Math.PI) / 180
  let out = ''
  if (d.h) {
    const top = 50
    out += `<polygon class="s" points="20,${gy} 20,${top} 70,${top} 70,${gy}"/>` + line(70, gy, 300, gy) + text(14, (top + gy) / 2, `${d.h} m`, 'middle', 'ti').replace('<text', `<text transform="rotate(-90 14 ${(top + gy) / 2})"`)
    let path = `M70 ${top}`
    for (let i = 1; i <= 40; i++) { const t = i / 40; path += `L${n(70 + 200 * t)} ${n(top + (gy - top) * t * t)}` }
    out += `<path class="c1 dashp" d="${path}"/>` + arrow(70, top, 125, top, `${d.labelU ?? 'u'} m/s`)
  } else {
    out += line(15, gy, 305, gy)
    const R = 250, hmax = Math.min(130, (R * Math.tan(a)) / 4)
    let path = `M30 ${gy}`
    for (let i = 1; i <= 40; i++) { const t = i / 40; path += `L${n(30 + R * t)} ${n(gy - 4 * hmax * t * (1 - t))}` }
    out += `<path class="c1 dashp" d="${path}"/>`
    const ang = Math.atan2(4 * hmax, R)
    out += arrow(30, gy, 30 + 62 * Math.cos(ang), gy - 62 * Math.sin(ang), `${d.labelU ?? 'u'} m/s`) + text(66, gy - 5, `${d.angle}°`, 'start', 'ti')
  }
  return out
}

function venn(d: Extract<Diagram, { k: 'venn' }>): string {
  return `<rect class="s" x="20" y="15" width="280" height="170" rx="4"/><circle class="s" cx="125" cy="100" r="62"/><circle class="s" cx="195" cy="100" r="62"/>` +
    text(88, 48, d.la ?? 'A', 'middle', 'tb') + text(232, 48, d.lb ?? 'B', 'middle', 'tb') + text(98, 105, d.a) + text(160, 105, d.ab) + text(222, 105, d.b) + text(272, 172, d.out)
}

function tree(d: Extract<Diagram, { k: 'tree' }>): string {
  let out = ''
  const x0 = 20, y0 = 100, x1 = 120, x2 = 240, ys = [55, 145]
  d.l1.forEach(([lab, p], i) => {
    out += line(x0, y0, x1, ys[i]) + text((x0 + x1) / 2 - 6, (y0 + ys[i]) / 2 + (i ? 14 : -6), p, 'middle', 'ti') + text(x1 + 10, ys[i] + 4, lab, 'start', 'tb')
    d.l2[i].forEach(([lab2, p2], j) => {
      const yy = ys[i] + (j ? 28 : -28)
      out += line(x1 + 30, ys[i], x2, yy) + text((x1 + 30 + x2) / 2, (ys[i] + yy) / 2 + (j ? 14 : -5), p2, 'middle', 'ti') + text(x2 + 8, yy + 4, lab2, 'start', 'tb')
    })
  })
  return out
}

function normal(d: Extract<Diagram, { k: 'normal' }>): string {
  const X = (z: number) => 160 + z * 42, Y = (z: number) => 165 - 130 * Math.exp(-0.5 * z * z)
  const lo = Math.max(-3.5, d.lo ?? -3.5), hi = Math.min(3.5, d.hi ?? 3.5)
  let shade = `${n(X(lo))},165`
  for (let i = 0; i <= 50; i++) { const z = lo + ((hi - lo) * i) / 50; shade += ` ${n(X(z))},${n(Y(z))}` }
  shade += ` ${n(X(hi))},165`
  let path = ''
  for (let i = 0; i <= 100; i++) { const z = -3.5 + (7 * i) / 100; path += `${i ? 'L' : 'M'}${n(X(z))} ${n(Y(z))}` }
  let out = (d.lo !== undefined || d.hi !== undefined ? `<polygon class="shade" points="${shade}"/>` : '') + `<path class="c0" d="${path}"/>` + line(10, 165, 310, 165, 'ax')
  for (const [z, lab] of d.labels ?? []) { const zc = Math.max(-3.4, Math.min(3.4, z)); out += line(X(zc), 165, X(zc), 170, 'ax') + text(X(zc), 184, lab, 'middle', 'ti') }
  return out
}

function vectors(d: Extract<Diagram, { k: 'vectors' }>): string {
  const xs = d.vs.flatMap((v) => [v.from[0], v.to[0]]), ys = d.vs.flatMap((v) => [v.from[1], v.to[1]])
  const x0 = Math.min(...xs, 0), x1 = Math.max(...xs, 1), y0 = Math.min(...ys, 0), y1 = Math.max(...ys, 1)
  const s = Math.min(260 / (x1 - x0 || 1), 150 / (y1 - y0 || 1))
  const X = (x: number) => 30 + (x - x0) * s, Y = (y: number) => 175 - (y - y0) * s
  return line(X(x0), Y(0), X(x1), Y(0), 'ax') + line(X(0), Y(y0), X(0), Y(y1), 'ax') + d.vs.map((v) => arrow(X(v.from[0]), Y(v.from[1]), X(v.to[0]), Y(v.to[1]), v.label)).join('')
}

function pulley(d: Extract<Diagram, { k: 'pulley' }>): string {
  const box = (x: number, y: number, lab: string) => `<rect class="blk" x="${x - 14}" y="${y}" width="28" height="24"/>` + text(x, y + 40, lab, 'middle', 'ti')
  if (d.table) return `<polygon class="s" points="20,90 230,90 230,180 20,180"/>` + `<rect class="blk" x="80" y="66" width="34" height="24"/>` + text(97, 58, d.m1, 'middle', 'ti') + line(114, 78, 236, 78) + `<circle class="s" cx="238" cy="88" r="10"/>` + line(248, 88, 248, 130) + box(248, 130, d.m2)
  if (d.incline) {
    const a = (d.incline * Math.PI) / 180, bx = 30, by = 175, len = 200, tx = bx + len * Math.cos(a), ty = by - len * Math.sin(a)
    const mx = bx + 0.5 * len * Math.cos(a), my = by - 0.5 * len * Math.sin(a)
    return `<polygon class="s" points="${bx},${by} ${n(tx)},${by} ${n(tx)},${n(ty)}"/>` + text(bx + 44, by - 5, `${d.incline}°`, 'start', 'ti') +
      `<rect class="blk" x="${n(mx - 13)}" y="${n(my - 24)}" width="26" height="22" transform="rotate(${-d.incline} ${n(mx)} ${n(my)})"/>` + text(mx - 26, my - 30, d.m1, 'middle', 'ti') +
      line(mx + 12 * Math.cos(a) - 12 * Math.sin(a), my - 12 * Math.sin(a) - 12 * Math.cos(a), tx + 2, ty - 12) + `<circle class="s" cx="${n(tx + 6)}" cy="${n(ty - 4)}" r="9"/>` + line(tx + 15, ty - 4, tx + 15, ty + 50) + box(tx + 15, ty + 50, d.m2)
  }
  return line(110, 12, 210, 12) + line(160, 12, 160, 30) + `<circle class="s" cx="160" cy="44" r="16"/>` + line(144, 44, 144, 120) + line(176, 44, 176, 90) + box(144, 120, d.m1) + box(176, 90, d.m2)
}

function beam(d: Extract<Diagram, { k: 'beam' }>): string {
  const X = (x: number) => 40 + (x / d.len) * 240, y = 100
  let out = `<rect class="blk" x="40" y="${y - 5}" width="240" height="10"/>` + text(32, y + 4, 'A', 'end', 'tb') + text(288, y + 4, 'B', 'start', 'tb')
  for (const s of d.supports) out += `<polygon class="s" points="${n(X(s))},${y + 5} ${n(X(s) - 9)},${y + 24} ${n(X(s) + 9)},${y + 24}"/>`
  d.loads.forEach((l, i) => { out += l.up ? arrow(X(l.at), y - 5, X(l.at), y - 50, l.label) : arrow(X(l.at), y + 5, X(l.at), y + 52 + (i % 2) * 14, l.label) })
  out += line(40, 178, 280, 178, 'dash') + text(160, 194, `${d.len} m`, 'middle', 'ti')
  return out
}

function axesPlot(pts: [number, number][], xl: string, yl: string) {
  const xm = Math.max(...pts.map((p) => p[0])) || 1, ym = Math.max(...pts.map((p) => p[1])) || 1
  const X = (x: number) => 40 + (x / xm) * 250, Y = (y: number) => 165 - (y / ym) * 135
  const ax = line(40, 165, 305, 165, 'ax') + line(40, 165, 40, 18, 'ax') + text(304, 182, xl, 'end', 'ti') + text(34, 22, yl, 'end', 'ti')
  return { X, Y, ax }
}
function vt(d: Extract<Diagram, { k: 'vt' }>): string {
  const { X, Y, ax } = axesPlot(d.pts, d.xl ?? 't (s)', d.yl ?? 'v (m/s)')
  let out = ax + `<path class="c0" d="${d.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n(X(x))} ${n(Y(y))}`).join('')}"/>`
  const seenX = new Set<number>(), seenY = new Set<number>()
  for (const [x, y] of d.pts) {
    if (x > 0 && !seenX.has(x)) { seenX.add(x); out += line(X(x), 165, X(x), Y(y), 'dash') + text(X(x), 180, String(x), 'middle', 'ti') }
    if (y > 0 && !seenY.has(y)) { seenY.add(y); out += text(35, Y(y) + 4, String(y), 'end', 'ti') }
  }
  return out
}
function scatter(d: Extract<Diagram, { k: 'scatter' }>): string {
  const { X, Y, ax } = axesPlot(d.pts, d.xl ?? 'x', d.yl ?? 'y')
  let out = ax + d.pts.map(([x, y]) => `<circle class="pt" cx="${n(X(x))}" cy="${n(Y(y))}" r="3"/>`).join('')
  if (d.line) { const xm = Math.max(...d.pts.map((p) => p[0])); out += line(X(0), Y(d.line[0]), X(xm), Y(d.line[0] + d.line[1] * xm), 'c1') }
  return out
}
function box(d: Extract<Diagram, { k: 'box' }>): string {
  const all = [...d.five, ...(d.outliers ?? [])], lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.08 || 1
  const X = (x: number) => 25 + ((x - lo + pad) / (hi - lo + 2 * pad)) * 270
  const [a, q1, m, q3, b] = d.five
  let out = line(X(a), 80, X(q1), 80) + line(X(q3), 80, X(b), 80) + line(X(a), 68, X(a), 92) + line(X(b), 68, X(b), 92) +
    `<rect class="blk" x="${n(X(q1))}" y="55" width="${n(X(q3) - X(q1))}" height="50"/>` + line(X(m), 55, X(m), 105) + line(20, 140, 300, 140, 'ax')
  for (const v of d.five) out += line(X(v), 140, X(v), 145, 'ax') + text(X(v), 160, String(v), 'middle', 'ti')
  for (const o of d.outliers ?? []) out += text(X(o), 85, '×', 'middle', 'tb')
  return out
}
function hist(d: Extract<Diagram, { k: 'hist' }>): string {
  const xm = Math.max(...d.bars.map((b) => b[1])), x0 = Math.min(...d.bars.map((b) => b[0])), ym = Math.max(...d.bars.map((b) => b[2]))
  const X = (x: number) => 40 + ((x - x0) / (xm - x0)) * 250, Y = (y: number) => 165 - (y / ym) * 130
  return line(40, 165, 305, 165, 'ax') + line(40, 165, 40, 20, 'ax') + text(34, 24, 'fd', 'end', 'ti') +
    d.bars.map(([a, b, h]) => `<rect class="blk" x="${n(X(a))}" y="${n(Y(h))}" width="${n(X(b) - X(a))}" height="${n(165 - Y(h))}"/>` + text(X(a), 180, String(a), 'middle', 'ti')).join('') + text(X(xm), 180, String(xm), 'middle', 'ti')
}
function sector(d: Extract<Diagram, { k: 'sector' }>): string {
  const cx = 80, cy = 160, r = 150, a = Math.min(d.angle, 2.6), ex = cx + r * Math.cos(a), ey = cy - r * Math.sin(a)
  const big = a > Math.PI ? 1 : 0
  return `<path class="blk" d="M${cx} ${cy} L${cx + r} ${cy} A${r} ${r} 0 ${big} 0 ${n(ex)} ${n(ey)} Z"/>` + text(cx + r / 2, cy + 16, d.r, 'middle', 'ti') +
    `<path class="s" d="M${cx + 26} ${cy} A26 26 0 0 0 ${n(cx + 26 * Math.cos(a))} ${n(cy - 26 * Math.sin(a))}"/>` + text(cx + 40 * Math.cos(a / 2), cy - 40 * Math.sin(a / 2) + 4, d.theta, 'middle', 'ti')
}
function triangle(d: Extract<Diagram, { k: 'triangle' }>): string {
  const A = [50, 165], B = [280, 165], C = [200, 35]
  const mid = (p: number[], q: number[]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  let out = `<polygon class="s" points="${A} ${B} ${C}"/>` + text(A[0] - 8, A[1] + 6, 'A', 'end', 'tb') + text(B[0] + 8, B[1] + 6, 'B', 'start', 'tb') + text(C[0], C[1] - 8, 'C', 'middle', 'tb')
  if (d.a) { const m = mid(B, C); out += text(m[0] + 10, m[1], d.a, 'start', 'ti') }
  if (d.b) { const m = mid(A, C); out += text(m[0] - 10, m[1], d.b, 'end', 'ti') }
  if (d.c) { const m = mid(A, B); out += text(m[0], m[1] + 16, d.c, 'middle', 'ti') }
  if (d.A) out += text(A[0] + 34, A[1] - 8, d.A, 'start', 'ti')
  if (d.B) out += text(B[0] - 30, B[1] - 8, d.B, 'end', 'ti')
  if (d.C) out += text(C[0] - 2, C[1] + 30, d.C, 'middle', 'ti')
  return out
}

const LABEL: Record<Diagram['k'], string> = {
  graph: 'Graph', incline: 'Force diagram on an inclined plane', forces: 'Force diagram', projectile: 'Projectile path', venn: 'Venn diagram', tree: 'Tree diagram',
  normal: 'Normal distribution curve', vectors: 'Vector diagram', pulley: 'Pulley system', beam: 'Beam with supports and loads', vt: 'Velocity-time graph', box: 'Box plot',
  hist: 'Histogram', scatter: 'Scatter diagram', sector: 'Sector of a circle', triangle: 'Triangle ABC',
}

export function renderDiagram(d: Diagram): string {
  let body: string
  switch (d.k) {
    case 'graph': body = graph(d); break
    case 'incline': body = incline(d); break
    case 'forces': body = forces(d); break
    case 'projectile': body = projectile(d); break
    case 'venn': body = venn(d); break
    case 'tree': body = tree(d); break
    case 'normal': body = normal(d); break
    case 'vectors': body = vectors(d); break
    case 'pulley': body = pulley(d); break
    case 'beam': body = beam(d); break
    case 'vt': body = vt(d); break
    case 'box': body = box(d); break
    case 'hist': body = hist(d); break
    case 'scatter': body = scatter(d); break
    case 'sector': body = sector(d); break
    case 'triangle': body = triangle(d); break
  }
  const svg = wrap(body, LABEL[d.k])
  if (/NaN|undefined|Infinity/.test(svg)) throw new Error(`diagram ${d.k} produced invalid coordinates`)
  return svg
}
