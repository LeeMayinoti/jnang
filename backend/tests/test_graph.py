from backend.app.agents.graph import app as graph_app


def test_compiled_graph_generation_flow():
    initial_state = {"theme": "sharing honey"}
    final_state = graph_app.invoke(initial_state, config={"configurable": {"thread_id": "test-thread-1"}})

    assert "draft_narrative" in final_state
    assert len(final_state["draft_narrative"]) > 0
    assert "motifemes" in final_state
    assert "story_moves" in final_state
    assert "grade_report" in final_state
    assert "overall_grade" in final_state["grade_report"]


def test_compiled_graph_input_story_flow():
    input_story = "In the n!ore, a young hunter broke a taboo by going into the bush alone. An elder intervened and restored peace."
    initial_state = {"input_story": input_story}
    final_state = graph_app.invoke(initial_state, config={"configurable": {"thread_id": "test-thread-2"}})

    assert final_state["draft_narrative"] == input_story
    assert "motifemes" in final_state
    assert "story_moves" in final_state
    assert "grade_report" in final_state
    assert "overall_grade" in final_state["grade_report"]

