"""
Agent 2 — Classifier / Parser
================================
Identifies Alan Dundes motifemes (from the canonical 8) and Propp/Dundes
story moves (narrative functions) in the folktale using structured LLM output.
"""

import os
from typing import List
from pydantic import BaseModel, Field
from backend.app.agents.state import NarrativeState
from backend.app.agents.prompts import CLASSIFIER_SYSTEM_PROMPT, CLASSIFIER_USER_PROMPT
from backend.app.utils.context_builder import get_classifier_graph_context


# ---------------------------------------------------------------------------
# Structured output schema
# ---------------------------------------------------------------------------

DUNDES_MOTIFEMES = [
    "Lack",
    "Interdiction",
    "Violation",
    "Consequence",
    "Mediation",
    "Lack Liquidated",
    "Departure",
    "Return",
]


class ClassificationOutput(BaseModel):
    """Structured output from the Classifier agent."""

    motifemes: List[str] = Field(
        description=(
            "Ordered list of Dundes motifemes present in the story. "
            "Use ONLY these exact labels: "
            "Lack, Interdiction, Violation, Consequence, "
            "Mediation, Lack Liquidated, Departure, Return."
        )
    )
    story_moves: List[str] = Field(
        description=(
            "Key narrative moves (Propp-style verb-action phrases) that drive the plot, "
            "e.g. 'Elder issues taboo against lone travel into the Bush', "
            "'Community performs trance dance to heal the sick hunter', "
            "'Meat distributed equally among all camp members'."
        )
    )


# ---------------------------------------------------------------------------
# Node function
# ---------------------------------------------------------------------------

def classifier_node(state: NarrativeState) -> dict:
    """
    Agent 2 — Classifier / Parser
    Reads:  draft_narrative
    Writes: motifemes, story_moves
    """
    print("[Classifier] Running...")

    draft = state.get("draft_narrative", "")
    if not draft:
        print("[Classifier] No narrative to classify — returning empty results.")
        return {"motifemes": [], "story_moves": []}

    # -----------------------------------------------------------------------
    # API key check
    # -----------------------------------------------------------------------
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your-openai-api-key-here":
        print("[Classifier] No valid API key — using mock classification.")
        return {
            "motifemes": ["Lack", "Interdiction", "Violation", "Consequence", "Mediation", "Lack Liquidated", "Return"],
            "story_moves": [
                "Elder issues prohibition against lone travel into the Bush",
                "Young hunter violates interdiction out of hunger",
                "Rain-animal punishes violator with illness",
                "Hero performs trance dance to invoke ancestral spirit (g//awasi)",
                "Brothers return with water; community shares equally among all families",
            ],
        }

    # -----------------------------------------------------------------------
    # LLM structured classification
    # -----------------------------------------------------------------------
    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=api_key)
        structured_llm = llm.with_structured_output(ClassificationOutput)

        graph_ctx = get_classifier_graph_context()
        messages = [
            ("system", CLASSIFIER_SYSTEM_PROMPT),
            ("user", CLASSIFIER_USER_PROMPT.format(draft_narrative=draft, graph_context=graph_ctx)),
        ]

        print("[Classifier] Invoking LLM for structured classification...")
        result: ClassificationOutput = structured_llm.invoke(messages)

        # Validate motifemes against the canonical 8
        valid_motifemes = [m for m in result.motifemes if m in DUNDES_MOTIFEMES]
        invalid = [m for m in result.motifemes if m not in DUNDES_MOTIFEMES]
        if invalid:
            print(f"[Classifier] Warning: LLM returned non-canonical motifemes (dropped): {invalid}")

        print(f"[Classifier] Motifemes: {valid_motifemes}")
        print(f"[Classifier] Story moves: {len(result.story_moves)} detected")

        return {
            "motifemes": valid_motifemes,
            "story_moves": result.story_moves,
        }

    except Exception as e:
        print(f"[Classifier] LLM error: {e} — using mock fallback.")
        return {
            "motifemes": ["Lack", "Violation", "Consequence", "Lack Liquidated"],
            "story_moves": [
                "Protagonist faces need or absence",
                "Taboo is broken by a character",
                "Consequence follows the violation",
                "Community restores sharing order",
            ],
        }
