/** Distribution functions used by generators. The Python verifier recomputes these with mpmath. */

export function nCr(n: number, r: number): number {
  if (r < 0 || r > n) return 0
  r = Math.min(r, n - r)
  let c = 1
  for (let i = 1; i <= r; i++) c = (c * (n - r + i)) / i
  return Math.round(c)
}

export function binomPmf(n: number, p: number, k: number): number {
  if (k < 0 || k > n) return 0
  return nCr(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)
}

/** P(X <= k) for X ~ B(n, p) */
export function binomCdf(n: number, p: number, k: number): number {
  let s = 0
  for (let i = 0; i <= Math.min(k, n); i++) s += binomPmf(n, p, i)
  return Math.min(1, s)
}

/** Standard normal CDF (Marsaglia's series; accurate to ~1e-15). */
export function phi(z: number): number {
  if (z < -8) return 0
  if (z > 8) return 1
  let sum = z, term = z
  for (let i = 3; i < 400; i += 2) {
    term *= (z * z) / i
    const next = sum + term
    if (next === sum) break
    sum = next
  }
  return 0.5 + sum * Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI)
}

export function normCdf(x: number, mu = 0, sigma = 1): number { return phi((x - mu) / sigma) }

/** Inverse standard normal CDF: Acklam's approximation refined with two Newton steps. */
export function invPhi(p: number): number {
  if (p <= 0 || p >= 1) return NaN
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  let x: number
  if (p < 0.02425) {
    const q = Math.sqrt(-2 * Math.log(p))
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  } else if (p > 1 - 0.02425) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  } else {
    const q = p - 0.5, r = q * q
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }
  for (let i = 0; i < 2; i++) {
    const e = phi(x) - p
    x -= e / (Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI))
  }
  return x
}

export function invNorm(p: number, mu = 0, sigma = 1): number { return mu + sigma * invPhi(p) }
