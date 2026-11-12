"""
Agent 3 — Grader
==================
Evaluates a Ju|'hoansi folktale on:
  1. Cultural Authenticity — egalitarianism, food sharing, kinship/marriage
  2. Motifeme Coverage — coherence of the Dundes motifeme chain

Uses structured LLM output (GradeReport Pydantic schema).
"""

import os
from typing import List
from pydantic import BaseModel, Field
from backend.app.agents.state import NarrativeState
from backend.app.agents.prompts import GRADER_SYSTEM_PROMPT, GRADER_USER_PROMPT


# ---------------------------------------------------------------------------
# Structured output schema
# ---------------------------------------------------------------------------

class GradeReport(BaseModel):
    """Structured grading output from Agent 3."""

    # Dimension 1 — Cultural Authenticity sub-scores
    egalitarianism_score: float = Field(
        ge=0.0, le=10.0,
        description=(
            "Score 0–10: Does the story embody radical equality and communal non-hierarchy? "
            "CRITICAL: hoarding rewarded with no consequence → 0."
        )
    )
    food_sharing_score: float = Field(
        ge=0.0, le=10.0,
        description=(
            "Score 0–10: Is communal sharing of food, water, or honey meaningfully central? "
            "CRITICAL: hoarding goes unpunished → 0."
        )
    )
    kinship_score: float = Field(
        ge=0.0, le=10.0,
        description=(
            "Score 0–10: Are Ju|'hoansi kinship roles (!ga grandmother, !o uncle, !xo age-mate) "
            "and marriage customs (hxaro, brideservice) present and functionally active?"
        )
    )
    cultural_authenticity_score: float = Field(
        ge=0.0, le=10.0,
        description="Average of egalitarianism_score, food_sharing_score, and kinship_score."
    )

    # Dimension 2 — Motifeme Coverage
    motifeme_score: float = Field(
        ge=0.0, le=10.0,
        description=(
            "Score 0–10: Is there a coherent, well-formed Dundes motifeme chain? "
            "A short clean chain (e.g. Lack → Lack Liquidated) can score 8–9. "
            "Brevity is never penalized."
        )
    )

    # Summary
    overall_grade: str = Field(
        description=(
            "One of: Excellent (both ≥ 8.5), Good (both ≥ 7.0), Adequate (both ≥ 5.0), "
            "Needs Work (either < 5.0), Fails (any CRITICAL criterion triggered)."
        )
    )
    comments: str = Field(
        description="Narrative explanation of the scores, referencing specific story moments."
    )
    suggestions: List[str] = Field(
        description="Actionable suggestions to improve cultural authenticity or structure."
    )


# ---------------------------------------------------------------------------
# Helper — derive overall_grade from scores (safety net if LLM mis-labels)
# ---------------------------------------------------------------------------

def _derive_grade(cultural: float, motifeme: float, egal: float, food: float) -> str:
    if egal == 0.0 or food == 0.0:
        return "Fails"
    if cultural >= 8.5 and motifeme >= 8.5:
        return "Excellent"
    if cultural >= 7.0 and motifeme >= 7.0:
        return "Good"
    if cultural >= 5.0 and motifeme >= 5.0:
        return "Adequate"
    return "Needs Work"


# ---------------------------------------------------------------------------
# Node function
# ---------------------------------------------------------------------------

def grader_node(state: NarrativeState) -> dict:
    """
    Agent 3 — Grader
    Reads:  draft_narrative, motifemes, story_moves
    Writes: grade_report
    """
    print("[Grader] Running...")

    draft = state.get("draft_narrative", "")
    motifemes = state.get("motifemes", [])
    story_moves = state.get("story_moves", [])

    if not draft:
        print("[Grader] No narrative to grade — returning zero report.")
        return {
            "grade_report": {
                "egalitarianism_score": 0.0,
                "food_sharing_score": 0.0,
                "kinship_score": 0.0,
                "cultural_authenticity_score": 0.0,
                "motifeme_score": 0.0,
                "overall_grade": "Fails",
                "comments": "No narrative provided.",
                "suggestions": ["Provide a story to grade."],
            }
        }

    # -----------------------------------------------------------------------
    # API key check
    # -----------------------------------------------------------------------
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your-openai-api-key-here":
        print("[Grader] No valid API key — using mock grade report.")
        return {
            "grade_report": {
                "egalitarianism_score": 9.0,
                "food_sharing_score": 9.5,
                "kinship_score": 7.0,
                "cultural_authenticity_score": 8.5,
                "motifeme_score": 8.0,
                "overall_grade": "Excellent",
                "comments": (
                    "[MOCK] No API key set. "
                    f"Motifemes found: {motifemes}. "
                    f"Story moves: {len(story_moves)}."
                ),
                "suggestions": ["Set OPENAI_API_KEY in backend/.env to receive a real grade."],
            }
        }

    # -----------------------------------------------------------------------
    # LLM structured grading
    # -----------------------------------------------------------------------
    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=api_key)
        structured_llm = llm.with_structured_output(GradeReport)

        moves_str = "\n- ".join(story_moves) if story_moves else "None detected"
        user_prompt = GRADER_USER_PROMPT.format(
            draft_narrative=draft,
            motifemes=", ".join(motifemes) if motifemes else "None detected",
            story_moves=moves_str,
        )

        messages = [
            ("system", GRADER_SYSTEM_PROMPT),
            ("user", user_prompt),
        ]

        print("[Grader] Invoking LLM for structured grading...")
        result: GradeReport = structured_llm.invoke(messages)

        # Safety-net: re-derive grade from raw scores in case LLM mis-labels
        computed_grade = _derive_grade(
            result.cultural_authenticity_score,
            result.motifeme_score,
            result.egalitarianism_score,
            result.food_sharing_score,
        )
        if computed_grade != result.overall_grade:
            print(
                f"[Grader] Grade label corrected: '{result.overall_grade}' -> '{computed_grade}'"
            )

        report = result.model_dump()
        report["overall_grade"] = computed_grade

        print(
            f"[Grader] Grade: {computed_grade} | "
            f"Cultural={result.cultural_authenticity_score:.1f} "
            f"(Egal={result.egalitarianism_score:.1f}, "
            f"Food={result.food_sharing_score:.1f}, "
            f"Kinship={result.kinship_score:.1f}) | "
            f"Motifeme={result.motifeme_score:.1f}"
        )
        return {"grade_report": report}

    except Exception as e:
        print(f"[Grader] LLM error: {e} — returning error report.")
        return {
            "grade_report": {
                "egalitarianism_score": 0.0,
                "food_sharing_score": 0.0,
                "kinship_score": 0.0,
                "cultural_authenticity_score": 0.0,
                "motifeme_score": 0.0,
                "overall_grade": "Fails",
                "comments": f"Grading failed: {e}",
                "suggestions": [],
            }
        }
