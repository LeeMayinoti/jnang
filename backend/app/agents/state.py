from typing import TypedDict, List, Dict, Any, Optional

class NarrativeState(TypedDict):
    # Inputs
    theme: str
    target_motifeme_skeleton: Optional[List[str]]
    
    # Mid-process variables
    draft_narrative: str
    motifeme_skeleton: List[str]
    spatial_transitions: List[Dict[str, Any]]  # e.g., [{"character": "G!ara", "from": "Camp", "to": "Bush", "line": 12}]
    linguistic_terms: List[str]                  # Ju|'hoan terms used (validated via dictionary)
    
    # Critic & Feedback Loop
    critique_report: Dict[str, Any]
    syntactic_score: float                       # Scale 0.0 to 10.0
    cultural_score: float                        # Scale 0.0 to 10.0
    iteration_count: int
    max_iterations: int
    status: str                                  # "continue", "approved", "failed"
