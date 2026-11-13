import json
import math
import uuid
from pathlib import Path
from statistics import mean
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.app.agents.graph import app as graph_app
from backend.app.agents.nodes import classifier_node, generator_node, grader_node
from backend.app.core.database import init_db
from backend.app.core import chat_store
from backend.app.utils.context_builder import get_graph_preview

app = FastAPI(
    title="Ju|'hoansi Narrative Agentic Generator (jnang)",
    description="3-Agent narrative pipeline: Generator, Classifier, and Grader",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()
    chat_store.init()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    theme: Optional[str] = Field(default="sharing honey", description="Seed theme for narrative generator")
    input_story: Optional[str] = Field(default=None, description="Existing story text (if set, skips generation)")
    thread_id: Optional[str] = Field(default=None, description="Optional conversation or thread tracking ID")


class GenerateResponse(BaseModel):
    draft_narrative: str
    motifemes: List[str]
    story_moves: List[str]
    grade_report: Dict[str, Any]
    thread_id: str


class GeneratorRequest(BaseModel):
    theme: str = Field(default="sharing honey")


class GeneratorResponse(BaseModel):
    draft_narrative: str


class ClassifierRequest(BaseModel):
    draft_narrative: str


class ClassifierResponse(BaseModel):
    motifemes: List[str]
    story_moves: List[str]


class GraderRequest(BaseModel):
    draft_narrative: str
    motifemes: Optional[List[str]] = Field(default_factory=list)
    story_moves: Optional[List[str]] = Field(default_factory=list)


class GraderResponse(BaseModel):
    grade_report: Dict[str, Any]


# Thread management models
class ThreadCreateRequest(BaseModel):
    title: Optional[str] = Field(default="New Chat")
    mode: Optional[str] = Field(default="generate")


class ThreadRenameRequest(BaseModel):
    title: str


# ---------------------------------------------------------------------------
# Core routes
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Ju|'hoansi Narrative Agentic Generator (jnang)",
        "agents": ["Agent 1: Generator", "Agent 2: Classifier", "Agent 3: Grader"],
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/graph/preview")
def graph_preview(theme: str = "sharing honey"):
    return get_graph_preview(theme)


# ---------------------------------------------------------------------------
# Thread / chat history endpoints
# ---------------------------------------------------------------------------

@app.get("/threads")
def list_threads():
    return chat_store.list_sessions()


@app.post("/threads", status_code=201)
def create_thread(req: ThreadCreateRequest):
    thread_id = str(uuid.uuid4())
    return chat_store.create_session(thread_id, title=req.title or "New Chat", mode=req.mode or "generate")


@app.get("/threads/{thread_id}")
def get_thread(thread_id: str):
    session = chat_store.get_session(thread_id)
    if not session:
        raise HTTPException(status_code=404, detail="Thread not found")
    messages = chat_store.get_messages(thread_id)
    return {**session, "messages": messages}


@app.patch("/threads/{thread_id}")
def rename_thread(thread_id: str, req: ThreadRenameRequest):
    ok = chat_store.rename_session(thread_id, req.title)
    if not ok:
        raise HTTPException(status_code=404, detail="Thread not found")
    return {"ok": True}


@app.delete("/threads/{thread_id}", status_code=204)
def delete_thread(thread_id: str):
    ok = chat_store.delete_session(thread_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Thread not found")


# ---------------------------------------------------------------------------
# Pipeline endpoints
# ---------------------------------------------------------------------------

@app.post("/generate", response_model=GenerateResponse)
def generate_story(req: GenerateRequest):
    active_thread_id = req.thread_id or str(uuid.uuid4())

    # Ensure session exists
    if not chat_store.get_session(active_thread_id):
        chat_store.create_session(active_thread_id)

    config = {"configurable": {"thread_id": active_thread_id}}

    initial_state: Dict[str, Any] = {}
    if req.input_story:
        initial_state["input_story"] = req.input_story
    if req.theme:
        initial_state["theme"] = req.theme

    # Persist user message
    user_text = req.input_story if req.input_story else f"Generate a story about: {req.theme}"
    chat_store.add_message(active_thread_id, "user", user_text)

    try:
        final_state = graph_app.invoke(initial_state, config=config)

        bot_text = "Here is the finished story and pipeline analysis:"
        lineage = get_graph_preview(req.theme or "sharing honey") if not req.input_story else None
        payload = {
            "story": {"title": req.theme or "Generated Story", "text": final_state.get("draft_narrative", "")},
            "analysis": {
                "motifemes": final_state.get("motifemes", []),
                "moves": final_state.get("story_moves", []),
                "grade": final_state.get("grade_report", {}),
            },
            **({"lineage": lineage} if lineage else {}),
        }
        chat_store.add_message(active_thread_id, "bot", bot_text, payload)

        # Auto-title: first 40 chars of user prompt if still "New Chat"
        session = chat_store.get_session(active_thread_id)
        if session and session.get("title") in ("New Chat", ""):
            auto_title = user_text[:40].strip()
            chat_store.touch_session(active_thread_id, title=auto_title)
        else:
            chat_store.touch_session(active_thread_id)

        return GenerateResponse(
            draft_narrative=final_state.get("draft_narrative", ""),
            motifemes=final_state.get("motifemes", []),
            story_moves=final_state.get("story_moves", []),
            grade_report=final_state.get("grade_report", {}),
            thread_id=active_thread_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/generator", response_model=GeneratorResponse)
def run_generator_agent(req: GeneratorRequest):
    try:
        res = generator_node({"theme": req.theme})
        return GeneratorResponse(draft_narrative=res.get("draft_narrative", ""))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/classifier", response_model=ClassifierResponse)
def run_classifier_agent(req: ClassifierRequest):
    try:
        res = classifier_node({"draft_narrative": req.draft_narrative})
        return ClassifierResponse(
            motifemes=res.get("motifemes", []),
            story_moves=res.get("story_moves", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/grader", response_model=GraderResponse)
def run_grader_agent(req: GraderRequest):
    try:
        res = grader_node({
            "draft_narrative": req.draft_narrative,
            "motifemes": req.motifemes or [],
            "story_moves": req.story_moves or [],
        })
        return GraderResponse(grade_report=res.get("grade_report", {}))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def _summarize_eval_rows(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    by_arm = {
        "baseline": [r for r in rows if r.get("arm") == "baseline"],
        "full_jnang": [r for r in rows if r.get("arm") == "full_jnang"],
    }

    def arm_stats(sub: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not sub:
            return {}
        tot_gloss = sum(r["deterministic_checks"]["total_glossed_terms"] for r in sub)
        ver_gloss = sum(r["deterministic_checks"]["verified_glossed_terms"] for r in sub)
        preset = [r for r in sub if r.get("theme_source") == "preset"]
        held = [r for r in sub if r.get("theme_source") == "held_out"]
        return {
            "n": len(sub),
            "judge": {
                "cultural_authenticity": round(mean(r["independent_judge"]["cultural_authenticity_score"] for r in sub), 2),
                "egalitarianism": round(mean(r["independent_judge"]["egalitarianism_score"] for r in sub), 2),
                "food_sharing": round(mean(r["independent_judge"]["food_sharing_score"] for r in sub), 2),
                "kinship": round(mean(r["independent_judge"]["kinship_score"] for r in sub), 2),
                "motifeme": round(mean(r["independent_judge"]["motifeme_score"] for r in sub), 2),
                "no_hoarding_pct": round(100.0 * sum(1 for r in sub if r["independent_judge"]["egalitarianism_score"] > 0 and r["independent_judge"]["food_sharing_score"] > 0) / len(sub), 1),
                "no_hoarding_count": sum(1 for r in sub if r["independent_judge"]["egalitarianism_score"] > 0 and r["independent_judge"]["food_sharing_score"] > 0),
                "preset_cultural": round(mean(r["independent_judge"]["cultural_authenticity_score"] for r in preset), 2) if preset else 0.0,
                "held_out_cultural": round(mean(r["independent_judge"]["cultural_authenticity_score"] for r in held), 2) if held else 0.0,
            },
            "in_pipe": {
                "cultural_authenticity": round(mean(r["inpipeline_grade"]["cultural_authenticity_score"] for r in sub), 2),
                "egalitarianism": round(mean(r["inpipeline_grade"]["egalitarianism_score"] for r in sub), 2),
                "food_sharing": round(mean(r["inpipeline_grade"]["food_sharing_score"] for r in sub), 2),
                "kinship": round(mean(r["inpipeline_grade"]["kinship_score"] for r in sub), 2),
                "motifeme": round(mean(r["inpipeline_grade"]["motifeme_score"] for r in sub), 2),
                "no_hoarding_pct": round(100.0 * sum(1 for r in sub if r["inpipeline_grade"]["egalitarianism_score"] > 0 and r["inpipeline_grade"]["food_sharing_score"] > 0) / len(sub), 1),
                "no_hoarding_count": sum(1 for r in sub if r["inpipeline_grade"]["egalitarianism_score"] > 0 and r["inpipeline_grade"]["food_sharing_score"] > 0),
            },
            "deterministic": {
                "trope_free_pct": round(100.0 * sum(1 for r in sub if r["deterministic_checks"]["trope_free"]) / len(sub), 1),
                "trope_free_count": sum(1 for r in sub if r["deterministic_checks"]["trope_free"]),
                "verified_gloss_pct": round(100.0 * ver_gloss / tot_gloss, 1) if tot_gloss else 0.0,
                "verified_gloss_count": ver_gloss,
                "total_gloss_count": tot_gloss,
                "mean_word_count": round(mean(len(r.get("draft_narrative", "").split()) for r in sub), 1),
                "mean_char_count": round(mean(r.get("draft_char_len", len(r.get("draft_narrative", ""))) for r in sub), 1),
            },
        }

    pairs: Dict[str, Dict[str, Dict[str, Any]]] = {}
    for r in rows:
        pairs.setdefault(r["theme_id"], {})[r["arm"]] = r

    wins = sum(
        1 for p in pairs.values()
        if "baseline" in p and "full_jnang" in p
        and p["full_jnang"]["independent_judge"]["cultural_authenticity_score"]
        > p["baseline"]["independent_judge"]["cultural_authenticity_score"]
    )
    n_pairs = sum(1 for p in pairs.values() if "baseline" in p and "full_jnang" in p)
    p_val = sum(math.comb(n_pairs, i) for i in range(wins, n_pairs + 1)) / (2 ** n_pairs) if n_pairs else 1.0

    diffs = [r["inpipeline_grade"]["cultural_authenticity_score"] - r["independent_judge"]["cultural_authenticity_score"] for r in rows]
    grade_matches = sum(1 for r in rows if r["inpipeline_grade"]["overall_grade"] == r["independent_judge"]["overall_grade"])

    return {
        "n_cells": len(rows),
        "n_themes": n_pairs,
        "corpus": {"total_stories": 14, "formalised_neo4j_rag": 11, "held_out": 3},
        "baseline": arm_stats(by_arm["baseline"]),
        "full_jnang": arm_stats(by_arm["full_jnang"]),
        "sign_test": {"wins": wins, "n": n_pairs, "p_value": round(p_val, 4)},
        "grader_agreement": {
            "matches": grade_matches,
            "total": len(rows),
            "pct": round(100.0 * grade_matches / len(rows), 1) if rows else 0.0,
            "mae_cultural": round(mean(abs(d) for d in diffs), 2) if diffs else 0.0,
            "signed_diff_cultural": round(mean(diffs), 2) if diffs else 0.0,
        },
    }


@app.get("/eval/results")
def get_eval_results():
    eval_path = Path(__file__).resolve().parents[2] / "context" / "data" / "eval_results.jsonl"
    if not eval_path.exists():
        raise HTTPException(status_code=404, detail=f"Evaluation file not found: {eval_path}")
    rows = [json.loads(line) for line in eval_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    return {"rows": rows, "summary": _summarize_eval_rows(rows)}
