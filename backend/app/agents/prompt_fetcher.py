"""
Prompt Fetcher Utility
======================
Manages loading system and user prompts and compiling template variables.
Supports extension to third-party prompt tracking tools (e.g., Langfuse/Langsmith).
"""

from backend.app.agents.prompts import (
    GENERATOR_SYSTEM_PROMPT, GENERATOR_USER_PROMPT,
    CLASSIFIER_SYSTEM_PROMPT, CLASSIFIER_USER_PROMPT,
    GRADER_SYSTEM_PROMPT, GRADER_USER_PROMPT,
)

LOCAL_PROMPTS = {
    "generator-system": GENERATOR_SYSTEM_PROMPT,
    "generator-user":   GENERATOR_USER_PROMPT,
    "classifier-system": CLASSIFIER_SYSTEM_PROMPT,
    "classifier-user":   CLASSIFIER_USER_PROMPT,
    "grader-system": GRADER_SYSTEM_PROMPT,
    "grader-user":   GRADER_USER_PROMPT,
}


def get_prompt_pair(agent_name: str, user_vars: dict) -> tuple:
    """
    Retrieves system and user prompts for the specified agent.
    Formats the user prompt using the provided variables.

    Args:
        agent_name: One of "generator", "classifier", "grader"
        user_vars:  Dict of template variables to inject into the user prompt

    Returns:
        (system_prompt_str, compiled_user_prompt_str, prompt_metadata)
        Third value is reserved for future prompt management tracking.
    """
    system_str = LOCAL_PROMPTS.get(f"{agent_name}-system", "")
    user_template = LOCAL_PROMPTS.get(f"{agent_name}-user", "")

    try:
        compiled_user = user_template.format(**user_vars)
    except KeyError as ke:
        print(f"Prompt template missing variable: {ke}")
        compiled_user = user_template

    return system_str, compiled_user, None
