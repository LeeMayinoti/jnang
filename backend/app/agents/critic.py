from backend.app.agents.state import NarrativeState

def critic_node(state: NarrativeState) -> dict:
    """
    Agent 3: Critic / Grader Node
    Evaluates syntactic alignment, vocabulary authenticity, and cultural semantic integrity.
    If either syntactic_score or cultural_score is below 8.0, provides critique feedback.
    """
    print("Running Critic Agent Node...")
    draft = state.get("draft_narrative", "")
    
    # In a real system, this evaluates the draft using dictionary checks and LLM evaluation.
    # We will scaffold a simple passing check:
    syntactic_score = 9.0
    cultural_score = 9.0
    status = "approved" if (syntactic_score >= 8.0 and cultural_score >= 8.0) else "continue"
    
    return {
        "syntactic_score": syntactic_score,
        "cultural_score": cultural_score,
        "critique_report": {"comments": "Story looks authentic and values resource sharing."},
        "status": status
    }
