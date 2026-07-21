from langgraph.graph import StateGraph, END, START
from backend.app.agents.state import NarrativeState
from backend.app.agents.nodes import generator_node, classifier_node, grader_node


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


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

workflow = StateGraph(NarrativeState)

# Nodes
workflow.add_node("generator", generator_node)
workflow.add_node("echo_input", echo_input_story)
workflow.add_node("classifier", classifier_node)
workflow.add_node("grader", grader_node)

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
workflow.add_edge("grader", END)

# Compile (no checkpointer — keep it simple)
app = workflow.compile()
