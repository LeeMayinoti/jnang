"""
Fair-Comparison Eval Runner (evaluation-only)
================================================
Runs the pre-registered 8-theme x 2-arm (16-cell) comparison between the
naive baseline generator (Arm A) and the full jnang pipeline (Arm B),
logging every generation plus both an in-pipeline grade and an
independent, blind, cross-vendor judge grade to a JSONL file.

Usage:
    python eval_runner.py --dry-run            # smoke test, no API spend
    python eval_runner.py                       # real run
    python eval_runner.py --resume              # skip already-logged cells
    python eval_runner.py --allow-mock-judge    # proceed without a working
                                                 # GOOGLE_API_KEY (NOT recommended
                                                 # -- independent_judge rows would
                                                 # be mock data, defeating the point)
"""

import argparse
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

_ROOT_DIR = Path(__file__).resolve().parent.parent
if str(_ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(_ROOT_DIR))

from dotenv import load_dotenv  # noqa: E402

from backend.app.agents.graph import app as graph_app  # noqa: E402
from backend.app.agents.nodes.baseline_generator import baseline_generator_node  # noqa: E402
from backend.app.utils.context_builder import (  # noqa: E402
    select_relevant_stories,
    get_neo4j_context,
)
from backend.app.eval.independent_judge import independent_judge_grade  # noqa: E402
from backend.app.eval.deterministic_checks import (  # noqa: E402
    check_trope_free,
    check_orthography,
)
from backend.app.eval.themes import PRESET_THEMES, HELD_OUT_THEMES  # noqa: E402

GENERATOR_MODEL = "gpt-4o-mini"
GENERATOR_TEMPERATURE = 0.7

# Verbatim from generator.py's two fallback branches -- used only to detect
# (heuristically, without modifying generator.py) whether the full_jnang arm
# silently hit a fallback path on a given cell.
_GENERATOR_NO_KEY_FALLBACK = (
    "In the dry n!ore (territory), G!ara's family faced a great lack — "
    "their waterhole had run dry. "
    "The elder (!ga) warned the young hunters: do not go beyond the ridge alone. "
    "But G!ara's youngest age-mate (!xo), hungry and impatient, slipped away into the Bush. "
    "He found a deep spring, but a rain-animal guarded it and struck him with illness. "
    "G!ara followed his brother's tracks and called upon the ancestral g//awasi through "
    "trance dance beside a small fire. "
    "Healed, they returned together with water-filled ostrich eggs for the whole camp. "
    "The zo (honey-water) was shared with every family — no one was left without."
)
_GENERATOR_ERROR_FALLBACK = (
    "In the dry n!ore, the camp faced a great lack. "
    "An elder's interdiction was violated by a young hunter. "
    "Consequence followed, but through mediation by the community "
    "the lack was liquidated and all shared equally in the return."
)


def _all_cells():
    for t in PRESET_THEMES:
        for arm in ("baseline", "full_jnang"):
            yield {"theme_id": t["id"], "theme_prompt": t["theme_prompt"],
                   "theme_source": "preset", "arm": arm}
    for t in HELD_OUT_THEMES:
        for arm in ("baseline", "full_jnang"):
            yield {"theme_id": t["id"], "theme_prompt": t["theme_prompt"],
                   "theme_source": "held_out", "arm": arm}


def run_cell(theme_id: str, theme_prompt: str, theme_source: str, arm: str) -> dict:
    """Runs one (theme, arm) cell end-to-end and returns one JSONL row dict."""
    errors = []
    row = {
        "run_id": str(uuid.uuid4()),
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "theme_id": theme_id,
        "theme_source": theme_source,
        "theme_prompt": theme_prompt,
        "arm": arm,
        "generator_model": GENERATOR_MODEL,
        "generator_temperature": GENERATOR_TEMPERATURE,
    }

    thread_id = f"eval-{theme_id}-{arm}"
    config = {"configurable": {"thread_id": thread_id}}

    try:
        if arm == "baseline":
            gen_result = baseline_generator_node({"theme": theme_prompt})
            draft_narrative = gen_result["draft_narrative"]
            used_fallback = gen_result["used_fallback"]

            final_state = graph_app.invoke({"input_story": draft_narrative}, config=config)

            row["rag_stories_used"] = []
            row["rag_context_included"] = False
            row["neo4j_context_used"] = False
        else:
            final_state = graph_app.invoke({"theme": theme_prompt}, config=config)
            draft_narrative = final_state.get("draft_narrative", "")
            used_fallback = draft_narrative.strip() in (
                _GENERATOR_NO_KEY_FALLBACK.strip(),
                _GENERATOR_ERROR_FALLBACK.strip(),
            )

            selected = select_relevant_stories(theme_prompt)
            row["rag_stories_used"] = [p.stem for p in selected]
            row["rag_context_included"] = len(selected) > 0
            row["neo4j_context_used"] = bool(get_neo4j_context(theme_prompt))

        row["draft_narrative"] = draft_narrative
        row["draft_char_len"] = len(draft_narrative)
        row["used_fallback"] = used_fallback
        row["classifier_model"] = GENERATOR_MODEL
        row["motifemes"] = final_state.get("motifemes", [])
        row["story_moves"] = final_state.get("story_moves", [])
        row["inpipeline_grade"] = final_state.get("grade_report", {})
        row["inpipeline_grader_model"] = GENERATOR_MODEL

    except Exception as e:
        errors.append(f"generation/pipeline error: {e}")
        row.setdefault("draft_narrative", "")
        row.setdefault("draft_char_len", 0)
        row.setdefault("used_fallback", True)
        row.setdefault("rag_stories_used", [])
        row.setdefault("rag_context_included", False)
        row.setdefault("neo4j_context_used", False)
        row.setdefault("classifier_model", GENERATOR_MODEL)
        row.setdefault("motifemes", [])
        row.setdefault("story_moves", [])
        row.setdefault("inpipeline_grade", {})
        row.setdefault("inpipeline_grader_model", GENERATOR_MODEL)

    try:
        judge_report = independent_judge_grade(row["draft_narrative"])
        row["independent_judge_model"] = judge_report.pop("judge_model", None)
        row["independent_judge"] = judge_report
    except Exception as e:
        errors.append(f"independent judge error: {e}")
        row["independent_judge_model"] = None
        row["independent_judge"] = {}

    try:
        trope = check_trope_free(row["draft_narrative"])
        ortho = check_orthography(row["draft_narrative"])
        row["deterministic_checks"] = {**trope, **ortho}
    except Exception as e:
        errors.append(f"deterministic checks error: {e}")
        row["deterministic_checks"] = {}

    row["errors"] = errors
    row["notes"] = None
    return row


def _already_logged(out_path: Path) -> set:
    logged = set()
    if not out_path.exists():
        return logged
    with open(out_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
                logged.add((r["theme_id"], r["arm"]))
            except Exception:
                continue
    return logged


def main():
    sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser(description="jnang fair-comparison eval runner")
    parser.add_argument("--out", default=str(_ROOT_DIR / "context" / "data" / "eval_results.jsonl"))
    parser.add_argument("--dry-run", action="store_true",
                         help="Exercise fallback paths only -- no real API spend.")
    parser.add_argument("--resume", action="store_true",
                         help="Skip theme_id+arm pairs already present in --out.")
    parser.add_argument("--allow-mock-judge", action="store_true",
                         help="Proceed even without a valid GOOGLE_API_KEY (NOT recommended "
                              "for a real run -- independent_judge rows would be mock data).")
    args = parser.parse_args()

    out_path = Path(args.out)

    if args.dry_run:
        # Every node's fallback check is `not api_key or api_key == "<sentinel>"`.
        # We set (not pop) these sentinels because several code paths lazily
        # call load_dotenv() later (e.g. context_builder.get_neo4j_context ->
        # core.config), and python-dotenv's default override=False uses
        # os.environ.setdefault() -- which only skips keys that already EXIST.
        # A pop()'d (absent) key gets silently refilled by that later call;
        # an explicitly-set sentinel value survives it.
        print("[EvalRunner] --dry-run: forcing sentinel API keys so every node hits its fallback path.")
        os.environ["OPENAI_API_KEY"] = "your-openai-api-key-here"
        os.environ["GOOGLE_API_KEY"] = "your-google-api-key-here"
    else:
        load_dotenv(dotenv_path=str(_ROOT_DIR / "backend" / ".env"))
        api_key = os.getenv("OPENAI_API_KEY", "")
        if not api_key or api_key == "your-openai-api-key-here":
            raise SystemExit(
                "[EvalRunner] Refusing to run for real without a valid OPENAI_API_KEY -- "
                "a fallback-authored row must never silently become real data. "
                "Use --dry-run to smoke-test instead."
            )
        google_key = os.getenv("GOOGLE_API_KEY", "")
        if (not google_key or google_key == "your-google-api-key-here") and not args.allow_mock_judge:
            raise SystemExit(
                "[EvalRunner] Refusing to run for real without a valid GOOGLE_API_KEY -- "
                "the independent judge would silently produce mock scores, defeating the "
                "purpose of this harness. Add GOOGLE_API_KEY to backend/.env, or pass "
                "--allow-mock-judge to proceed anyway (not recommended)."
            )

    already = _already_logged(out_path) if args.resume else set()
    if already:
        print(f"[EvalRunner] --resume: {len(already)} cell(s) already logged, will skip.")

    out_path.parent.mkdir(parents=True, exist_ok=True)
    total = 0
    with open(out_path, "a", encoding="utf-8") as f:
        for cell in _all_cells():
            key = (cell["theme_id"], cell["arm"])
            if key in already:
                print(f"[EvalRunner] Skipping already-logged cell {key}")
                continue

            print(f"[EvalRunner] Running cell theme={cell['theme_id']} arm={cell['arm']}...")
            row = run_cell(**cell)
            f.write(json.dumps(row, ensure_ascii=False) + "\n")
            f.flush()
            total += 1

            status = "OK" if not row["errors"] else f"ERRORS: {row['errors']}"
            print(f"[EvalRunner]   -> used_fallback={row['used_fallback']} {status}")

    print(f"[EvalRunner] Done. Wrote {total} new row(s) to {out_path}")


if __name__ == "__main__":
    main()
