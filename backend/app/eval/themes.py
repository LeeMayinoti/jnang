"""
Evaluation theme set (evaluation-only)
=========================================
PRESET_THEMES mirrors the 5 defaultPrompt strings already defined in
frontend/src/data/themes.js -- duplicated here (not imported, Python can't
import JS) with that file as the explicit source of truth, so a future
edit to one is at least visible as a diff against the other rather than
silently drifting.

HELD_OUT_THEMES are 3 stories from the source corpus (Ju'hoan Folktales.pdf)
that are NOT among the 4 formalized RDF stories and NOT in the RAG pool
(context/data/individual story files/) -- they live in the separate
context/data/held_out story files/ directory instead, so a "does jnang
generalize" test can't retrieve its own answer key. theme_prompt text is
drafted directly from each story's real SUMMARY, verified by reading the
actual page text, not invented.
"""

from pathlib import Path

_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "context" / "data"
_HELD_OUT_DIR = _DATA_DIR / "held_out story files"

# Source of truth: frontend/src/data/themes.js PRESET_THEMES[].defaultPrompt
PRESET_THEMES = [
    {
        "id": "sharing_honey",
        "theme_prompt": "sharing wild honey (zo) found in a hollow baobab tree",
    },
    {
        "id": "moon_life",
        "theme_prompt": (
            "The Moon dies and lives again, sending the Hare with a message "
            "of immortality to humans"
        ),
    },
    {
        "id": "trickster_waterhole",
        "theme_prompt": (
            "A trickster springhare attempting to hide the secret waterhole "
            "from the thirsty community"
        ),
    },
    {
        "id": "fire_origin",
        "theme_prompt": (
            "A woman first found fire under the armpit of the sacred bird "
            "and brought warmth to camp"
        ),
    },
    {
        "id": "elephant_water",
        "theme_prompt": (
            "The Great Elephant holding the water reservoir until small "
            "birds negotiate sharing"
        ),
    },
]

# Held-out, drafted from verified real summaries (see
# backend/extract_held_out_stories.py CHAPTER_PAGE_RANGES for provenance).
# Note (for the write-up): unlike the 5 presets, "Ostrich and the Tortoise"
# and "Ducks and People" are trickster/etiological tales without a
# food-sharing throughline -- a genuine mismatch with the rubric's
# egalitarianism/food-sharing sub-criteria that reflects the source
# corpus's full genre range, not a jnang defect. "Springhare Dances" is a
# clean hoarding/refusal-to-share tale that maps directly onto the rubric.
HELD_OUT_THEMES = [
    {
        "id": "ostrich_tortoise",
        "theme_prompt": (
            "A tortoise tricks an ostrich into unknowingly eating cooked "
            "tortoise eggs; when the ostrich realizes what he has eaten, his "
            "shocked reaction explains why ostriches have had red, split "
            "shins ever since"
        ),
        "source_chapter": 5,
        "ground_truth_pdf": str(_HELD_OUT_DIR / "The Ostrich and the Tortoise.pdf"),
    },
    {
        "id": "springhare_dances",
        "theme_prompt": (
            "A god lends Springhare a sacred dancing skin and asks for it "
            "back before the rain comes, but Springhare selfishly keeps "
            "dancing and refuses to return it -- explaining why springhares "
            "are pulled from their holes and killed by hunters today"
        ),
        "source_chapter": 6,
        "ground_truth_pdf": str(_HELD_OUT_DIR / "Springhare Dances.pdf"),
    },
    {
        "id": "ducks_and_people",
        "theme_prompt": (
            "Duck-people bathing in a waterhole are mistaken by a hungry "
            "man for prey; when he and his companions try to seize and eat "
            "them, the ducks turn and attack, and afterward return to human "
            "form and go on living among the Ju|'hoansi"
        ),
        "source_chapter": 7,
        "ground_truth_pdf": str(_HELD_OUT_DIR / "Ducks and People.pdf"),
    },
]
