from backend.app.agents.state import NarrativeState

def classifier_node(state: NarrativeState) -> dict:
    """
    Agent 1: Classifier / Parser Node
    Analyzes the draft narrative and extracts:
    1. The motifeme skeleton chain (e.g., Lack -> Violation -> Consequence).
    2. Characters and their roles (Hero, Donor, Helper, etc.).
    3. Spatial transitions between 'The Camp' and 'The Bush'.
    4. Custom indigenous motifs (Transmutation, Egalitarian Distribution, etc.).
    """
    print("Running Classifier Agent Node...")
    draft = state.get("draft_narrative", "")
    
    # In a full run, we would call the LLM to structure this.
    # Scaffolding returns basic extracted elements:
    return {
        "motifeme_skeleton": ["Lack", "Violation", "Consequence"],
        "spatial_transitions": [{"character": "G!ara", "from": "Camp", "to": "Bush", "line": 1}],
        "linguistic_terms": ["n!ore", "g//awasi"]
    }
