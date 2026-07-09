from backend.app.agents.state import NarrativeState

def generator_node(state: NarrativeState) -> dict:
    """
    Agent 2: Generator / Storywriter Node
    Generates a Ju|'hoansi story based on the provided theme and target skeleton.
    Addresses critique report feedback if available, and increments the iteration count.
    """
    print("Running Generator Agent Node...")
    iteration = state.get("iteration_count", 0) + 1
    theme = state.get("theme", "sharing honey")
    
    # Simple placeholder text draft for story writer
    draft_narrative = (
        "In the dry n!ore, G!ara and his family faced a great lack. "
        "They set out into the Bush. There, G!ara found a wild beehive overflowing with zo (honey). "
        "Rather than hoarding it, G!ara brought it back to the Camp and shared it with everyone, "
        "liquidating their lack and restoring peace."
    )
    
    return {
        "draft_narrative": draft_narrative,
        "iteration_count": iteration,
        "status": "continue"
    }
