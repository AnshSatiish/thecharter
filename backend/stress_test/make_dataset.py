"""Make a large test library by repeating the sample and synthetic projects with new ids.

    python stress_test/make_dataset.py 1000 stress_test/results/projects_1000.json
    python -m app.scripts.seed stress_test/results/projects_1000.json      (from backend/inference)

The copies keep their text but get a numbered title, so every project is indexed on its own. Only for
measuring speed: never load this into a database people use.
"""
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"


def main() -> None:
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent / "results" / f"projects_{count}.json"
    base = [*json.loads((DATA / "samples" / "projects.json").read_text(encoding="utf-8")),
            *json.loads((DATA / "synthetic" / "projects.json").read_text(encoding="utf-8"))]
    records = []
    for i in range(count):
        rec = json.loads(json.dumps(base[i % len(base)]))
        rec["id"] = 100_000 + i
        rec["title"] = f"{rec['title']} (test copy {i + 1})"
        records.append(rec)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(records, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {count} projects to {out}")


if __name__ == "__main__":
    main()
