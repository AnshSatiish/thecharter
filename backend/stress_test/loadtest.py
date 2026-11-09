"""Stress test for the search API: many simulated users searching at once.

Each level runs N users for a fixed time. Every user sends a search, waits for the answer and sends the
next one straight away (no thinking time), so N users here is a harsher load than N people on the site.
A user gives up after 10 seconds (counted as an error). Requests per second counts only the answers that
arrived inside the measured time, so one slow straggler cannot stretch the window.

    python stress_test/loadtest.py --base http://127.0.0.1:8000 --levels 1 5 10 25 50 100 --seconds 20

Prints a table per mode and writes the numbers to stress_test/results/<label>.json.
"""
import argparse
import asyncio
import json
import random
import statistics
import time
from collections import Counter
from pathlib import Path

import httpx

QUERIES = [
    "Oaxaca", "Darien Gap", "migration", "Nairobi protests", "fishing", "Day of the Dead", "climate",
    "people forced to leave home", "grief rituals", "young people protesting", "climate and livelihoods",
    "how families remember the dead", "crossing the jungle on foot", "a lake drying up", "life on the border",
    "trains and cities", "indigenous traditions", "water", "herders losing animals in winter", "youth",
]
TIMEOUT = 10  # seconds a user waits before giving up


def pct(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    values = sorted(values)
    return values[min(len(values) - 1, int(round(p / 100 * (len(values) - 1))))]


async def user(client: httpx.AsyncClient, base: str, mode: str, stop_at: float, out: list, rng: random.Random):
    while time.perf_counter() < stop_at:
        q = rng.choice(QUERIES)
        t0 = time.perf_counter()
        try:
            r = await client.get(f"{base}/api/projects/search", params={"q": q, "mode": mode, "limit": 20})
            ok, code = r.status_code == 200, r.status_code
            used = r.json().get("mode_used") if ok else None
        except httpx.HTTPError as exc:
            ok, used, code = False, None, type(exc).__name__
        out.append((time.perf_counter() - t0, ok, used, code, time.perf_counter()))


async def level(base: str, mode: str, users: int, seconds: float) -> dict:
    out: list = []
    limits = httpx.Limits(max_connections=users, max_keepalive_connections=users)
    async with httpx.AsyncClient(timeout=TIMEOUT, limits=limits) as client:
        start = time.perf_counter()
        stop_at = start + seconds
        await asyncio.gather(*(user(client, base, mode, stop_at, out, random.Random(i)) for i in range(users)))
    ok = [t for t, good, *_ in out if good]
    in_window = sum(1 for _, good, _, _, end in out if good and end <= stop_at)
    return {
        "mode": mode, "users": users, "requests": len(out), "errors": len(out) - len(ok),
        "per_second": round(in_window / seconds, 1),
        "p50_ms": round(pct(ok, 50) * 1000), "p95_ms": round(pct(ok, 95) * 1000), "p99_ms": round(pct(ok, 99) * 1000),
        "mean_ms": round(statistics.fmean(ok) * 1000) if ok else None,
        "fell_back_to_keyword": sum(1 for _, good, used, *_ in out if good and mode != "keyword" and used == "keyword"),
        "error_codes": dict(Counter(str(code) for _, good, _, code, _ in out if not good)),
    }


async def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:8000")
    ap.add_argument("--modes", nargs="+", default=["keyword", "hybrid"])
    ap.add_argument("--levels", nargs="+", type=int, default=[1, 5, 10, 25, 50, 100])
    ap.add_argument("--seconds", type=float, default=20)
    ap.add_argument("--label", default="run")
    args = ap.parse_args()

    async with httpx.AsyncClient(timeout=120) as client:  # warm up: the first hybrid search loads the model
        for mode in args.modes:
            (await client.get(f"{args.base}/api/projects/search", params={"q": "warm up", "mode": mode})).raise_for_status()

    rows = []
    for mode in args.modes:
        print(f"\n{mode}\n{'users':>6} {'req/s':>7} {'p50 ms':>7} {'p95 ms':>7} {'p99 ms':>7} {'errors':>7} {'requests':>9}  error codes")
        for users in args.levels:
            row = await level(args.base, mode, users, args.seconds)
            rows.append(row)
            print(f"{users:>6} {row['per_second']:>7} {row['p50_ms']:>7} {row['p95_ms']:>7} {row['p99_ms']:>7} "
                  f"{row['errors']:>7} {row['requests']:>9}  {row['error_codes'] or ''}", flush=True)

    out = Path(__file__).parent / "results" / f"{args.label}.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({"label": args.label, "seconds": args.seconds, "rows": rows}, indent=2), encoding="utf-8")
    print(f"\nwrote {out}")


if __name__ == "__main__":
    asyncio.run(main())
