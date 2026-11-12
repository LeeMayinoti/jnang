"""
Independent Judge (evaluation-only)
=====================================
Blind, cross-vendor grader used to check the in-pipeline grader.py's
self-grading bias (same model family as the Generator, and fed the
Classifier's own motifeme analysis as if it were ground truth).

This module is deliberately self-contained: zero import dependency on
agents/nodes/grader.py, and independent_judge_grade()'s signature has no
motifemes/story_moves parameters at all — it grades from raw story text
only, so the circularity problem in grader.py cannot be silently
reintroduced here later.
"""

import os
from typing import List, Optional

from pydantic import BaseModel, Field

from backend.app.eval.prompts import (
    INDEPENDENT_JUDGE_SYSTEM_PROMPT,
    INDEPENDENT_JUDGE_USER_PROMPT,
)

DEFAULT_MODEL = os.getenv("GEMINI_JUDGE_MODEL", "gemini-2.5-flash")

# This key is a Vertex AI Express Mode API key (Gemini Enterprise / Agent
# Platform), not a Generative Language API (AI Studio) key -- confirmed
# empirically: plain ChatGoogleGenerativeAI(api_key=...) fails with
# 403 API_KEY_SERVICE_BLOCKED (wrong endpoint for this key type), while
# vertexai=True succeeds. Only "gemini-2.5-flash" was reachable for this
# project/key among the model IDs tried; older aliases (gemini-2.0-flash,
# gemini-1.5-flash, versioned variants) 404'd as unavailable publisher
# models for this project.
_VERTEX_MODE = True


class IndependentGradeReport(BaseModel):
    """Structured output from the independent judge."""

    egalitarianism_score: float = Field(ge=0.0, le=10.0)
    food_sharing_score: float = Field(ge=0.0, le=10.0)
    kinship_score: float = Field(ge=0.0, le=10.0)
    cultural_authenticity_score: float = Field(ge=0.0, le=10.0)
    motifeme_score: float = Field(ge=0.0, le=10.0)
    detected_motifemes: List[str] = Field(
        description="The judge's own blind read of the Dundes motifeme chain, "
        "for comparison against the Classifier's self-reported motifemes."
    )
    overall_grade: str
    comments: str
    suggestions: List[str]


def _derive_grade(cultural: float, motifeme: float, egal: float, food: float) -> str:
    """Duplicated from grader.py's safety-net logic, not imported — keeps
    this module structurally independent of the in-pipeline grader."""
    if egal == 0.0 or food == 0.0:
        return "Fails"
    if cultural >= 8.5 and motifeme >= 8.5:
        return "Excellent"
    if cultural >= 7.0 and motifeme >= 7.0:
        return "Good"
    if cultural >= 5.0 and motifeme >= 5.0:
        return "Adequate"
    return "Needs Work"


def independent_judge_grade(draft_narrative: str, model: Optional[str] = None) -> dict:
    """
    Blind, independent grader. Takes ONLY draft_narrative — no
    motifemes/story_moves parameters exist on this function by design.
    Returns a dict with the IndependentGradeReport fields plus
    `used_fallback` and `judge_model`.
    """
    model = model or DEFAULT_MODEL
    print("[IndependentJudge] Running...")

    if not draft_narrative:
        return {
            "egalitarianism_score": 0.0, "food_sharing_score": 0.0, "kinship_score": 0.0,
            "cultural_authenticity_score": 0.0, "motifeme_score": 0.0,
            "detected_motifemes": [], "overall_grade": "Fails",
            "comments": "No narrative provided.", "suggestions": [],
            "used_fallback": True, "judge_model": model,
        }

    api_key = os.getenv("GOOGLE_API_KEY", "")
    if not api_key or api_key == "your-google-api-key-here":
        print("[IndependentJudge] No valid GOOGLE_API_KEY -- using mock grade report.")
        return {
            "egalitarianism_score": 5.0, "food_sharing_score": 5.0, "kinship_score": 5.0,
            "cultural_authenticity_score": 5.0, "motifeme_score": 5.0,
            "detected_motifemes": [], "overall_grade": "Adequate",
            "comments": "[MOCK] GOOGLE_API_KEY missing — this is not a real grade.",
            "suggestions": ["Set GOOGLE_API_KEY in backend/.env to receive a real independent grade."],
            "used_fallback": True, "judge_model": model,
        }

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI

        llm = ChatGoogleGenerativeAI(
            model=model, temperature=0, google_api_key=api_key, vertexai=_VERTEX_MODE
        )
        structured_llm = llm.with_structured_output(IndependentGradeReport)

        messages = [
            ("system", INDEPENDENT_JUDGE_SYSTEM_PROMPT),
            ("user", INDEPENDENT_JUDGE_USER_PROMPT.format(draft_narrative=draft_narrative)),
        ]

        print(f"[IndependentJudge] Invoking {model} for blind structured grading...")
        result: IndependentGradeReport = structured_llm.invoke(messages)

        computed_grade = _derive_grade(
            result.cultural_authenticity_score,
            result.motifeme_score,
            result.egalitarianism_score,
            result.food_sharing_score,
        )

        report = result.model_dump()
        report["overall_grade"] = computed_grade
        report["used_fallback"] = False
        report["judge_model"] = model

        print(
            f"[IndependentJudge] Grade: {computed_grade} | "
            f"Cultural={result.cultural_authenticity_score:.1f} | "
            f"Motifeme={result.motifeme_score:.1f}"
        )
        return report

    except Exception as e:
        print(f"[IndependentJudge] LLM error: {e} -- returning error report.")
        return {
            "egalitarianism_score": 0.0, "food_sharing_score": 0.0, "kinship_score": 0.0,
            "cultural_authenticity_score": 0.0, "motifeme_score": 0.0,
            "detected_motifemes": [], "overall_grade": "Fails",
            "comments": f"Grading failed: {e}", "suggestions": [],
            "used_fallback": True, "judge_model": model,
        }
