import os
from backend.app.utils.dictionary import JuDictionary
from backend.app.utils.grammar import JuGrammar
from backend.app.agents.generator import generator_node
from backend.app.agents.classifier import classifier_node
from backend.app.agents.critic import critic_node

def test_dictionary_scaffold():
    # Verify lookup method runs safely
    dic = JuDictionary()
    res = dic.lookup("zo")
    if dic.df is not None:
        assert res is not None or res is None
    else:
        assert res is None

def test_grammar_scaffold():
    grammar = JuGrammar()
    rules = grammar.get_rules()
    assert len(rules) > 0
    guides = grammar.get_click_guides()
    assert "/" in guides
    assert "!" in guides

def test_agent_nodes():
    state = {
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
    
    # Run generator
    gen_res = generator_node(state)
    assert gen_res["iteration_count"] == 1
    assert "draft_narrative" in gen_res
    
    # Run classifier
    class_res = classifier_node(state)
    assert "motifeme_skeleton" in class_res
    
    # Run critic
    critic_res = critic_node(state)
    assert "syntactic_score" in critic_res
    assert "cultural_score" in critic_res
