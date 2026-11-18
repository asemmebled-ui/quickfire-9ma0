// Draws the app icon (a lightning bolt over a sigma-like tick) as PNGs with no image dependencies.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0 })
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]) }

const bolt = [[0.58, 0.12], [0.3, 0.55], [0.48, 0.55], [0.4, 0.88], [0.72, 0.42], [0.53, 0.42], [0.62, 0.12]]
const inPoly = (x, y, poly) => { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins } return ins }

function png(size, file, pad = 0) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let r = 15, g = 20, b = 32
      const u = (x + 0.5) / size, v = (y + 0.5) / size
      const s = 1 - 2 * pad, uu = (u - pad) / s, vv = (v - pad) / s
      // 4x supersampling for smooth edges
      let cov = 0
      for (let k = 0; k < 4; k++) { const du = ((k % 2) - 0.25) / size / s, dv = ((k >> 1) - 0.25) / size / s; if (inPoly(uu + du, vv + dv, bolt)) cov++ }
      cov /= 4
      const gr = 0.5 + 0.5 * (1 - vv)
      r = Math.round(r * (1 - cov) + (255 * 0.98) * cov); g = Math.round(g * (1 - cov) + (196 * gr + 40) * cov); b = Math.round(b * (1 - cov) + 60 * cov)
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]))
}
png(192, 'public/icon-192.png')
png(512, 'public/icon-512.png', 0.1)
png(180, 'public/apple-touch-icon.png', 0.06)
console.log('icons written')
