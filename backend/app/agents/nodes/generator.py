"""
Agent 1 — Generator / Storywriter
===================================
Generates an authentic Ju|'hoansi folktale using:
  • Neo4j ontology context (characters, relations, events)
  • RAG corpus (transcribed story PDFs as stylistic examples)
  • Ju|'hoan dictionary (vocabulary sample for authentic word use)
  • LLM (OpenAI chat model)
"""

import os
from backend.app.agents.state import NarrativeState
from backend.app.agents.prompts import GENERATOR_SYSTEM_PROMPT, GENERATOR_USER_PROMPT
from backend.app.utils.context_builder import build_generator_context


def generator_node(state: NarrativeState) -> dict:
    """
    Agent 1 — Generator / Storywriter
    Reads:  theme
    Writes: draft_narrative
    """
    print("[Generator] Running...")

    theme = state.get("theme", "sharing honey")

    # -----------------------------------------------------------------------
    # Step 1 — Assemble context from Neo4j + RAG + dictionary
    # -----------------------------------------------------------------------
    print("[Generator] Building context from Neo4j / RAG / dictionary...")
    context = build_generator_context(theme)

    # -----------------------------------------------------------------------
    # Step 2 — Build prompt
    # -----------------------------------------------------------------------
    user_prompt = GENERATOR_USER_PROMPT.format(theme=theme, context=context)

    # -----------------------------------------------------------------------
    # Step 3 — Call LLM (or fall back to scaffolded story)
    # -----------------------------------------------------------------------
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key or api_key == "your-openai-api-key-here":
        print("[Generator] No valid API key — returning scaffolded story.")
        draft_narrative = (
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
        print(f"[Generator] Scaffolded story ({len(draft_narrative)} chars).")
        return {"draft_narrative": draft_narrative}

    try:
        from langchain_openai import ChatOpenAI

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,       # some creativity for story generation
            openai_api_key=api_key,
        )

        messages = [
            ("system", GENERATOR_SYSTEM_PROMPT),
            ("user", user_prompt),
        ]

        print("[Generator] Invoking LLM for story generation...")
        response = llm.invoke(messages)
        draft_narrative = response.content.strip()

        print(f"[Generator] Story generated ({len(draft_narrative)} chars).")
        return {"draft_narrative": draft_narrative}

    except Exception as e:
        print(f"[Generator] LLM error: {e} — returning scaffolded fallback.")
        draft_narrative = (
            "In the dry n!ore, the camp faced a great lack. "
            "An elder's interdiction was violated by a young hunter. "
            "Consequence followed, but through mediation by the community "
            "the lack was liquidated and all shared equally in the return."
        )
        return {"draft_narrative": draft_narrative}
