"""
Graph Archive Utility
=====================
Persists evaluated stories (generated or user-submitted) into Neo4j as :Story
nodes with their :NarrativeFunction move chains, :Motifeme links, and matched
canonical entity references.
"""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from backend.app.utils.context_builder import _get_neo4j_session
from backend.app.utils.graph_schema import DUNDES_MOTIFEME_DEFS

_ACCEPTED_GRADES = {"Excellent", "Good", "Adequate"}


def _story_status(grade_report: Dict[str, Any]) -> str:
    overall = grade_report.get("overall_grade", "")
    cultural = float(grade_report.get("cultural_authenticity_score", 0.0) or 0.0)
    motifeme = float(grade_report.get("motifeme_score", 0.0) or 0.0)
    if overall in _ACCEPTED_GRADES and cultural >= 5.0 and motifeme >= 5.0:
        return "accepted"
    return "rejected"


def archive_story_to_neo4j(state: Dict[str, Any]) -> Optional[str]:
    """
    Archives a graded story from NarrativeState into Neo4j.
    Returns the archived :Story id, or None if Neo4j is unavailable or text is empty.
    """
    draft = (state.get("draft_narrative") or "").strip()
    if not draft:
        return None

    try:
        session = _get_neo4j_session()
        if session is None:
            return None

        is_submitted = bool(state.get("input_story"))
        source = "user_submitted" if is_submitted else "generated"
        prefix = "SUB" if is_submitted else "GEN"
        digest = hashlib.sha1(draft.encode("utf-8")).hexdigest()[:10]
        story_id = f"{prefix}_{digest}"

        theme = state.get("theme") or ("user submission" if is_submitted else "untitled")
        title = f"{theme.strip().title()} ({story_id})"
        grade_report = state.get("grade_report") or {}
        status = _story_status(grade_report)
        overall_grade = str(grade_report.get("overall_grade", "Unknown"))
        cultural_score = float(grade_report.get("cultural_authenticity_score", 0.0) or 0.0)
        motifeme_score = float(grade_report.get("motifeme_score", 0.0) or 0.0)
        created_at = datetime.now(timezone.utc).isoformat()

        motifemes: List[str] = state.get("motifemes") or []
        story_moves: List[str] = state.get("story_moves") or []

        with session as s:
            s.run(
                """
                MERGE (st:Story {id: $id})
                SET st.label = $title,
                    st.title = $title,
                    st.theme = $theme,
                    st.type = 'Story',
                    st.source = $source,
                    st.status = $status,
                    st.overall_grade = $overall_grade,
                    st.cultural_authenticity_score = $cultural_score,
                    st.motifeme_score = $motifeme_score,
                    st.text = $text,
                    st.created_at = $created_at
                """,
                {
                    "id": story_id,
                    "title": title,
                    "theme": theme,
                    "source": source,
                    "status": status,
                    "overall_grade": overall_grade,
                    "cultural_score": cultural_score,
                    "motifeme_score": motifeme_score,
                    "text": draft,
                    "created_at": created_at,
                },
            )

            prev_move_id = None
            for idx, move_text in enumerate(story_moves, start=1):
                move_id = f"{story_id}_Move{idx}"
                s.run(
                    """
                    MATCH (st:Story {id: $story_id})
                    MERGE (nf:NarrativeFunction {id: $move_id})
                    SET nf.label = $label,
                        nf.description = $label,
                        nf.type = 'NarrativeFunction',
                        nf.source = $source
                    MERGE (st)-[:HAS_MOVE]->(nf)
                    """,
                    {
                        "story_id": story_id,
                        "move_id": move_id,
                        "label": move_text,
                        "source": source,
                    },
                )
                if prev_move_id:
                    s.run(
                        """
                        MATCH (prev:NarrativeFunction {id: $prev_id}), (curr:NarrativeFunction {id: $curr_id})
                        MERGE (curr)-[:FOLLOWS]->(prev)
                        """,
                        {"prev_id": prev_move_id, "curr_id": move_id},
                    )
                prev_move_id = move_id

                # Align motifemes proportionally to moves when available
                if motifemes:
                    m_idx = min(len(motifemes) - 1, int((idx - 1) * len(motifemes) / max(1, len(story_moves))))
                    motifeme = motifemes[m_idx]
                    if motifeme in DUNDES_MOTIFEME_DEFS:
                        s.run(
                            """
                            MATCH (nf:NarrativeFunction {id: $move_id})
                            MERGE (m:Motifeme {id: $motifeme})
                            MERGE (nf)-[:INSTANTIATES]->(m)
                            """,
                            {"move_id": move_id, "motifeme": motifeme},
                        )

            # Link to canonical entities mentioned in the story text
            s.run(
                """
                MATCH (st:Story {id: $story_id}), (e)
                WHERE (e:Person OR e:Animal OR e:Object OR e:MagicalAgent OR e:Location)
                  AND e.source = 'canonical'
                  AND size(coalesce(e.label, '')) >= 4
                  AND toLower($text) CONTAINS toLower(e.label)
                MERGE (st)-[:MENTIONS_ENTITY]->(e)
                """,
                {"story_id": story_id, "text": draft},
            )

        return story_id

    except Exception as e:
        print(f"[GraphArchive] Could not archive story to Neo4j: {e}")
        return None
