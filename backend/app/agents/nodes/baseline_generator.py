"""
Arm A — Naive Baseline Generator (evaluation-only)
====================================================
Represents what an off-the-shelf LLM produces when simply asked for a
Ju|'hoansi story, with NONE of jnang's scaffolding: no Neo4j ontology, no
RAG story excerpts, no dictionary, no motifeme/oicotype/kinship/spatial
instructions. Same model and temperature as the real Generator Agent
(gpt-4o-mini, temperature=0.7) so the only variable being isolated is
jnang's grounding, not a model swap.

Not wired into agents/graph.py — this is a comparison instrument, not a
4th pipeline agent. Called directly by the eval harness.
"""

import os

from backend.app.agents.state import NarrativeState

BASELINE_SYSTEM_PROMPT = (
    "You are a storyteller. Write a traditional folktale, attributed to the "
    "Ju|'hoansi San people of the Kalahari, based on the given theme.\n\n"
    "Return ONLY the story text — no JSON, no code fences, no meta-commentary."
)

BASELINE_USER_PROMPT = "Write a Ju|'hoansi folktale.\n\nTheme: {theme}"

# Deliberately generic — must NOT resemble jnang's own vocabulary (zo,
# n!ore, !ga, g//awasi, etc.), so a missing-API-key fallback here can't be
# mistaken for output that already reflects jnang's grounding.
_FALLBACK_STORY = (
    "Long ago, a wise old chief ruled over his kingdom from a great stone "
    "castle. One day a poor traveler came seeking gold, for he wished to "
    "buy a grand estate and live in comfort apart from his village. The "
    "chief granted him a chest of gold coins, and the traveler returned "
    "home rich, admired by all for his fortune."
)


def baseline_generator_node(state: NarrativeState) -> dict:
    """
    Arm A — Naive baseline generator.
    Reads:  theme
    Writes: draft_narrative, used_fallback
    """
    print("[BaselineGenerator] Running...")

    theme = state.get("theme", "sharing honey")

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your-openai-api-key-here":
        print("[BaselineGenerator] No valid API key — returning fallback story.")
        return {"draft_narrative": _FALLBACK_STORY, "used_fallback": True}

    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7, openai_api_key=api_key)

        messages = [
            ("system", BASELINE_SYSTEM_PROMPT),
            ("user", BASELINE_USER_PROMPT.format(theme=theme)),
        ]

        print("[BaselineGenerator] Invoking LLM for story generation...")
        response = llm.invoke(messages)
        draft_narrative = response.content.strip()

        print(f"[BaselineGenerator] Story generated ({len(draft_narrative)} chars).")
        return {"draft_narrative": draft_narrative, "used_fallback": False}

    except Exception as e:
        print(f"[BaselineGenerator] LLM error: {e} — returning fallback story.")
        return {"draft_narrative": _FALLBACK_STORY, "used_fallback": True}
