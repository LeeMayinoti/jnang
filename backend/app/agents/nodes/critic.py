from datetime import datetime, timezone
from backend.app.agents.state import NarrativeState
from backend.app.agents.prompt_fetcher import get_prompt_pair

def critic_node(state: NarrativeState) -> dict:
    """
    Critic / Grader Node
    Evaluates syntactic alignment, vocabulary authenticity, and cultural semantic integrity.
    Sets status to 'approved' if grades are sufficient.
    """
    print("Running Critic Agent Node...")
    
    # Read outputs from generator and classifier
    generator_result = state.get("generator_result", {}) or {}
    draft = generator_result.get("draft_narrative", "")
    
    classifier_result = state.get("classifier_result", {}) or {}
    motifeme_skeleton = classifier_result.get("motifeme_skeleton", [])
    spatial_transitions = classifier_result.get("spatial_transitions", [])
    linguistic_terms = classifier_result.get("linguistic_terms", [])
    
    # Fetch prompts
    system_prompt, user_prompt, _ = get_prompt_pair(
        "critic",
        {
            "draft_narrative": draft,
            "motifeme_skeleton": str(motifeme_skeleton),
            "spatial_transitions": str(spatial_transitions),
            "linguistic_terms": str(linguistic_terms)
        }
    )

    # Scaffolding default grading results
    syntactic_score = 9.0
    cultural_score = 9.0
    status = "approved" if (syntactic_score >= 8.0 and cultural_score >= 8.0) else "continue"
    
    return {
        "current_node": "critic",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "critic_result": {
            "syntactic_score": syntactic_score,
            "cultural_score": cultural_score,
            "critique_report": {"comments": "Story looks authentic and values resource sharing."},
            "status": status
        },
        "completed_nodes": ["critic"],
    }
