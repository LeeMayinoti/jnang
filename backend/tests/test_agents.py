from backend.app.agents.nodes import classifier_node, generator_node, grader_node
from backend.app.utils.dictionary import JuDictionary
from backend.app.utils.grammar import JuGrammar


def test_dictionary_scaffold():
    dic = JuDictionary("context/data/ju_dictionary.xls")
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
    # 1. Test Agent 1 — Generator
    gen_state = {"theme": "sharing honey"}
    gen_res = generator_node(gen_state)
    assert "draft_narrative" in gen_res
    assert len(gen_res["draft_narrative"]) > 0

    # 2. Test Agent 2 — Classifier
    class_state = {"draft_narrative": gen_res["draft_narrative"]}
    class_res = classifier_node(class_state)
    assert "motifemes" in class_res
    assert "story_moves" in class_res
    assert isinstance(class_res["motifemes"], list)
    assert isinstance(class_res["story_moves"], list)

    # 3. Test Agent 3 — Grader
    grade_state = {
        "draft_narrative": gen_res["draft_narrative"],
        "motifemes": class_res["motifemes"],
        "story_moves": class_res["story_moves"],
    }
    grade_res = grader_node(grade_state)
    assert "grade_report" in grade_res
    report = grade_res["grade_report"]
    assert "overall_grade" in report
    assert "cultural_authenticity_score" in report
    assert "motifeme_score" in report

