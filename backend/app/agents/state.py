from typing import TypedDict, List, Dict, Any, Optional


class NarrativeState(TypedDict, total=False):
    """
    FLAT NARRATIVE STATE
    ====================
    Flows through every node in the graph.
    Each agent reads what it needs and writes its results directly
    back to this flat dictionary — no nested sub-dicts, no reducers.
    """

    # === Input ===
    input_story: Optional[str]    # User-supplied story text; if set, skip generation
    theme: str                    # Seed theme for the Generator (used when no input_story)

    # === Agent 1 – Generator ===
    draft_narrative: str          # The story text (generated or echoed from input_story)

    # === Agent 2 – Classifier ===
    motifemes: List[str]          # Dundes motifemes identified (from the canonical 8)
    story_moves: List[str]        # Propp narrative functions / moves detected

    # === Agent 3 – Grader ===
    grade_report: Dict[str, Any]  # Grading output (rubric direction TBD by user)
