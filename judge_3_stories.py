"""
Judge the 3 community-review stories (evaluation-only)
=======================================================
Runs the same blind, cross-vendor independent judge and the two
deterministic checks used by eval_runner.py over the 3 narratives in
generated_3_stories.json, so the human reviewer's scores, the
in-pipeline grader's scores, and the independent judge's scores all
sit on identical texts.

Usage:
    python judge_3_stories.py
"""

import json
import sys
from pathlib import Path

_ROOT_DIR = Path(__file__).resolve().parent
if str(_ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(_ROOT_DIR))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(_ROOT_DIR / "backend" / ".env")

from backend.app.eval.independent_judge import independent_judge_grade  # noqa: E402
from backend.app.eval.deterministic_checks import (  # noqa: E402
    check_trope_free,
    check_orthography,
)

IN_PATH = _ROOT_DIR / "generated_3_stories.json"
OUT_PATH = _ROOT_DIR / "generated_3_stories_judged.json"

stories = json.loads(IN_PATH.read_text(encoding="utf-8"))
out = []

for s in stories:
    text = s["draft_narrative"]
    print(f"\n=== Story {s['index']}: {s['theme'][:60]} ===")
    judge = independent_judge_grade(text)
    trope = check_trope_free(text)
    ortho = check_orthography(text)
    ip = s.get("grade_report", {})
    print(
        f"  in-pipeline CA={ip.get('cultural_authenticity_score')} "
        f"kin={ip.get('kinship_score')} | independent CA="
        f"{judge.get('cultural_authenticity_score')} kin={judge.get('kinship_score')} "
        f"| grade={judge.get('overall_grade')} | mock={judge.get('used_fallback')}"
    )
    print(f"  tropes={trope} ortho={ortho['verified_glossed_terms']}/{ortho['total_glossed_terms']}")
    out.append({**s, "independent_judge": judge, "deterministic_checks": {**trope, **ortho}})

OUT_PATH.write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
print(f"\nWrote {OUT_PATH}")
