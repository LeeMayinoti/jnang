from langgraph.graph import StateGraph, END, START
from backend.app.agents.state import NarrativeState
from backend.app.agents.classifier import classifier_node
from backend.app.agents.generator import generator_node
from backend.app.agents.critic import critic_node

# Router function to determine next node
def should_continue(state: NarrativeState) -> str:
    iteration_count = state.get("iteration_count", 0)
    max_iterations = state.get("max_iterations", 3)
    status = state.get("status", "continue")
    
    if iteration_count >= max_iterations:
        return "end"
    if status == "approved":
        return "end"
    return "generate"

# Initialize and build the graph
workflow = StateGraph(NarrativeState)

# Add Nodes
workflow.add_node("generator", generator_node)
workflow.add_node("classifier", classifier_node)
workflow.add_node("critic", critic_node)

# Set Entrypoint
workflow.set_entry_point("generator")

# Add Static Edges
workflow.add_edge("generator", "classifier")
workflow.add_edge("classifier", "critic")

# Add Conditional Edges
workflow.add_conditional_edges(
    "critic",
    should_continue,
    {
        "generate": "generator",
        "end": END
    }
)

# Compile the workflow
app = workflow.compile()
