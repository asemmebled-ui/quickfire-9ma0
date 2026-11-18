/** Small deterministic RNG (mulberry32) so every generated question is reproducible from its seed. */
export class Rng {
  private s: number
  constructor(seed: number) { this.s = (seed * 2654435761 + 0x9e3779b9) >>> 0 }
  next(): number {
    let t = (this.s += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  /** integer in [a, b] inclusive */
  int(a: number, b: number): number { return a + Math.floor(this.next() * (b - a + 1)) }
  /** non-zero integer in [a, b] */
  nz(a: number, b: number): number { let v = 0; while (v === 0) v = this.int(a, b); return v }
  pick<T>(xs: readonly T[]): T { return xs[Math.floor(this.next() * xs.length)] }
  shuffle<T>(xs: readonly T[]): T[] {
    const a = xs.slice()
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }
  float(a: number, b: number): number { return a + this.next() * (b - a) }
}

export function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a }
