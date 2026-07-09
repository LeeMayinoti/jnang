from backend.app.agents.graph import app as graph_app

def test_compiled_graph():
    initial_state = {
        "theme": "sharing honey",
        "target_motifeme_skeleton": None,
        "draft_narrative": "",
        "motifeme_skeleton": [],
        "spatial_transitions": [],
        "linguistic_terms": [],
        "critique_report": {},
        "syntactic_score": 0.0,
        "cultural_score": 0.0,
        "iteration_count": 0,
        "max_iterations": 3,
        "status": "continue"
    }
    
    # Run the compiled workflow
    final_state = graph_app.invoke(initial_state)
    
    # Assertions to verify that the graph runs through and returns state updates
    assert final_state["iteration_count"] > 0
    assert len(final_state["draft_narrative"]) > 0
    assert final_state["status"] in ["approved", "continue", "failed"]
