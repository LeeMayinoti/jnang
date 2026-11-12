from __future__ import annotations

import os
from pathlib import Path

from langgraph.graph import StateGraph, END, START
from backend.app.agents.state import NarrativeState
from backend.app.agents.nodes import generator_node, classifier_node, grader_node
from backend.app.utils.graph_archive import archive_story_to_neo4j


# ---------------------------------------------------------------------------
# Routing: START → generator OR classifier
# ---------------------------------------------------------------------------

def route_start(state: NarrativeState) -> str:
    """
    If the user supplied a story via input_story, echo it into draft_narrative
    and jump straight to classification. Otherwise, generate a new story first.
    """
    if state.get("input_story"):
        return "classifier"
    return "generator"


def echo_input_story(state: NarrativeState) -> dict:
    """
    Passthrough node: copies input_story → draft_narrative so the rest of the
    pipeline always reads from draft_narrative regardless of origin.
    """
    return {"draft_narrative": state["input_story"]}


def archive_node(state: NarrativeState) -> dict:
    """
    Persists the evaluated story and its structural graph into Neo4j.
    """
    story_id = archive_story_to_neo4j(state)
    return {"archived_story_id": story_id}


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

workflow = StateGraph(NarrativeState)

# Nodes
workflow.add_node("generator", generator_node)
workflow.add_node("echo_input", echo_input_story)
workflow.add_node("classifier", classifier_node)
workflow.add_node("grader", grader_node)
workflow.add_node("archive", archive_node)

# START branches: input story provided → echo → classify; otherwise → generate → classify
workflow.add_conditional_edges(
    START,
    route_start,
    {
        "generator": "generator",
        "classifier": "echo_input",   # echo first so draft_narrative is always set
    }
)

# Linear pipeline
workflow.add_edge("generator", "classifier")
workflow.add_edge("echo_input", "classifier")
workflow.add_edge("classifier", "grader")
workflow.add_edge("grader", "archive")
workflow.add_edge("archive", END)

# ---------------------------------------------------------------------------
# Compile with SQLite checkpointer for persistent thread memory
# ---------------------------------------------------------------------------

def _build_app():
    try:
        import sqlite3
        from langgraph.checkpoint.sqlite import SqliteSaver

        db_path = Path(os.getenv("CHAT_DB_PATH", "./data/chat_history.db"))
        db_path.parent.mkdir(parents=True, exist_ok=True)

        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        saver = SqliteSaver(conn)
        return workflow.compile(checkpointer=saver)
    except Exception as e:
        print(f"[graph] SqliteSaver unavailable ({e}), compiling without checkpointer.")
        return workflow.compile()


app = _build_app()
