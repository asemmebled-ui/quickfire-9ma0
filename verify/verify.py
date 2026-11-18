"""
Independent answer verification for Quickfire 9MA0.

Every question exported by scripts/export-bank.ts carries `v.s`: a SymPy expression that restates the
problem from the numbers shown to the student. This script evaluates it with SymPy/mpmath (a different
implementation from the app's TypeScript) and compares the result with the app's stored answer.
Exit code 1 if anything disagrees, so the build fails.
"""
import json
import sys
from collections import Counter

import mpmath as mp
import sympy
from sympy import Integer, Rational, Symbol, lambdify, N

mp.mp.dps = 30
ns = {}
exec("from sympy import *", ns)
for name in "x y t c n k a b h u theta".split():
    ns[name] = Symbol(name)
ns["xr"] = Symbol("xr", real=True)
ns["xp"] = Symbol("xp", positive=True)
ns["rad"] = lambda d: d * sympy.pi / 180
ns["deg"] = lambda r: r * 180 / sympy.pi


def _f(v):
    return mp.mpf(sympy.N(v, 30))


def binompdf(n_, p, k_):
    p = _f(p)
    return mp.binomial(n_, k_) * p ** k_ * (1 - p) ** (n_ - k_)


def binomcdf(n_, p, k_):
    return mp.fsum(binompdf(n_, p, i) for i in range(0, int(k_) + 1))


def normcdf(x_, mu, sigma):
    return mp.ncdf((_f(x_) - _f(mu)) / _f(sigma))


def invnorm(p, mu, sigma):
    return _f(mu) + _f(sigma) * mp.sqrt(2) * mp.erfinv(2 * _f(p) - 1)


def crit_lower(n_, p, alpha):
    c_ = -1
    while binomcdf(n_, p, c_ + 1) <= alpha:
        c_ += 1
    return c_


def crit_upper(n_, p, alpha):
    c_ = n_ + 1
    while 1 - binomcdf(n_, p, c_ - 2) <= alpha:
        c_ -= 1
    return c_


def roots(expr, lo, hi, steps=7200):
    """All roots of expr (a string in x) in [lo, hi), by sign-change scan + bisection."""
    f = lambdify(ns["x"], eval(expr, ns), "mpmath")
    lo, hi = _f(lo), _f(hi)
    out = []
    xs = [mp.mpf(lo) + (mp.mpf(hi) - lo) * i / steps for i in range(steps + 1)]
    prev = None
    for i, xv in enumerate(xs):
        try:
            fv = f(xv)
        except ZeroDivisionError:
            prev = None
            continue
        if prev is not None and prev[1] * fv < 0:
            a_, b_ = prev[0], xv
            for _ in range(80):
                m = (a_ + b_) / 2
                if f(a_) * f(m) <= 0:
                    b_ = m
                else:
                    a_ = m
            r = (a_ + b_) / 2
            if abs(f(r)) < mp.mpf("1e-6") and r < hi:
                out.append(r)
        elif fv == 0 and xv < hi:
            out.append(xv)
        prev = (xv, fv)
    if not out:
        raise ValueError("no roots found for " + expr)
    return out


def iterate(f, x0, times):
    v = mp.mpf(x0) if not isinstance(x0, int) else x0
    for _ in range(times):
        v = f(v)
    return v


def trap(f, a_, b_, strips):
    hh = (mp.mpf(b_) - a_) / strips
    ys = [f(a_ + i * hh) for i in range(strips + 1)]
    return hh / 2 * (ys[0] + ys[-1] + 2 * mp.fsum(ys[1:-1]))


def ode(f, x0, y0, X):
    sol = mp.odefun(lambda xv, yv: [f(xv, yv[0])], x0, [mp.mpf(y0)])
    return sol(X)[0]


ns.update(binompdf=binompdf, binomcdf=binomcdf, normcdf=normcdf, invnorm=invnorm, crit_lower=crit_lower,
          crit_upper=crit_upper, roots=roots, iterate=iterate, trap=trap, ode=ode)


def to_float(v):
    if isinstance(v, bool):
        return float(v)
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, mp.mpf):
        return float(v)
    val = sympy.N(v, 20)
    if val.is_real is False:
        raise ValueError(f"not real: {val}")
    return float(val)


def close(a_, b_, rel=1e-7):
    return abs(a_ - b_) <= rel * max(1.0, abs(b_))


def main(path):
    recs = json.load(open(path, encoding="utf-8"))
    counts, fails, concept = Counter(), [], Counter()
    for r in recs:
        tag = r["id"] + (f"#{r['seed']}" if r["seed"] is not None else "")
        if not r["v"]:
            concept[r["type"]] += 1
            continue
        try:
            val = eval(r["v"]["s"], ns)
            if r["type"] == "expr":
                syms = [ns.get(v) or Symbol(v) for v in r["vars"]]
                f = lambdify(syms, val, "mpmath")
                diffs = []
                for pt, js in zip(r["points"], r["js"]):
                    if js is None:
                        continue
                    py = float(mp.re(f(*[pt[v] for v in r["vars"]])))
                    diffs.append((js - py, py))
                if len(diffs) < 3:
                    raise ValueError("fewer than 3 usable sample points")
                if r["addC"]:
                    d0 = diffs[0][0]
                    ok = all(abs(d - d0) <= 1e-6 * max(1.0, abs(py)) for d, py in diffs)
                else:
                    ok = all(abs(d) <= 1e-6 * max(1.0, abs(py)) for d, py in diffs)
                if not ok:
                    fails.append(f"{tag}: expression differs from SymPy result {val}")
            else:
                py = to_float(val)
                if not close(py, r["js"]):
                    fails.append(f"{tag}: app={r['js']!r} sympy={py!r}   [{r['v']['s']}]")
            counts[r["type"]] += 1
        except Exception as e:  # noqa: BLE001
            fails.append(f"{tag}: could not verify ({type(e).__name__}: {e})   [{r['v']['s']}]")

    total = sum(counts.values())
    print(f"Machine-verified answers: {total}  " + ", ".join(f"{k}={v}" for k, v in sorted(counts.items())))
    print(f"Not computable (definitions, wording, method choice; reviewed by reading): {sum(concept.values())}  "
          + ", ".join(f"{k}={v}" for k, v in sorted(concept.items())))
    if fails:
        print(f"\nFAILED: {len(fails)} answer(s) disagree")
        for f_ in fails[:80]:
            print("  " + f_)
        sys.exit(1)
    print("ALL VERIFIED ANSWERS AGREE WITH SYMPY/MPMATH")


if __name__ == "__main__":
    main(sys.argv[1])
