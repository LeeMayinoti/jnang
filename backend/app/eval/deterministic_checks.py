"""
Deterministic (non-LLM) checks (evaluation-only)
===================================================
Two of the paper's originally-claimed metrics -- "Authentic Oicotype Usage"
and "Click Consonant Orthographic Precision" -- corresponded to no
measurement code anywhere in the pipeline. These are objective,
non-LLM cross-checks against the LLM judges' subjective scores.
"""

import re
from pathlib import Path
from typing import List, Optional

from backend.app.utils.dictionary import JuDictionary

# Default European-trope keywords the Generator's system prompt explicitly
# forbids (castles, swords, gold coins, kingdoms, roads -- see
# GENERATOR_SYSTEM_PROMPT step 2). Word-boundary, case-insensitive.
# Note: "execute" is excluded because punitive/communal execution of
# transgressors is an authentic motif in canonical Ju|'hoansi tales (e.g. S4).
DEFAULT_TROPE_KEYWORDS = [
    "king", "castle", "gold", "sword", "crown", "kingdom", "throne",
]

# Ju|'hoansi click consonants and apostrophe are typed as ASCII punctuation
# in this corpus (see context_builder.py's own examples: !ga, //awasi,
# ǂ, n|um). Must be in the word-capture character class or glossed terms
# get truncated mid-word.
_GLOSS_PATTERN = re.compile(r"([A-Za-z!/ǃǂǁ'|]+)\s*\(([^)]+)\)")

_dictionary: Optional[JuDictionary] = None


def _get_dictionary() -> JuDictionary:
    global _dictionary
    if _dictionary is None:
        _dictionary = JuDictionary()
    return _dictionary


def check_trope_free(text: str, keywords: Optional[List[str]] = None) -> dict:
    """
    Scans for disallowed European-trope keywords using word-boundary regex
    (case-insensitive) so "king" doesn't false-positive on "seeking" or
    "kingfisher".
    """
    keywords = keywords or DEFAULT_TROPE_KEYWORDS
    flagged = []
    for kw in keywords:
        if re.search(rf"\b{re.escape(kw)}\b", text, re.IGNORECASE):
            flagged.append(kw)

    return {"trope_free": len(flagged) == 0, "flagged_terms": flagged}


_MOTIFEME_LABELS = {
    "lack", "interdiction", "violation", "consequence", "mediation",
    "lack liquidated", "departure", "return",
}


def check_orthography(text: str, dictionary: Optional[JuDictionary] = None) -> dict:
    """
    Extracts every "X (Y)" pair from the story and verifies it as a
    Ju|'hoansi vocabulary gloss against ju_dictionary.xls via the existing
    JuDictionary.lookup(), reused rather than reimplemented.

    Two corpus-observed patterns are handled:
      - "zo (honey)"      -- Ju|'hoansi term first, English gloss second.
      - "darkness (gǃu n!ang)" -- English word first, Ju|'hoansi term second.
    A pair is "verified" if EITHER side matches the dictionary. Pairs where
    either side is one of the 8 canonical Dundes motifeme labels are
    excluded entirely -- these are the Generator self-annotating its own
    structure (e.g. "lack (Lack)"), not a vocabulary gloss.
    """
    dictionary = dictionary or _get_dictionary()

    matches = _GLOSS_PATTERN.findall(text)
    total = 0
    verified_terms: List[str] = []
    unverified_terms: List[str] = []

    for word, gloss in matches:
        if word.strip().lower() in _MOTIFEME_LABELS or gloss.strip().lower() in _MOTIFEME_LABELS:
            continue
        total += 1
        if dictionary.lookup(word) or dictionary.lookup(gloss):
            verified_terms.append(word)
        else:
            unverified_terms.append(word)

    verified_ratio = (len(verified_terms) / total) if total > 0 else 0.0

    return {
        "total_glossed_terms": total,
        "verified_glossed_terms": len(verified_terms),
        "verified_ratio": round(verified_ratio, 3),
        "unverified_terms": unverified_terms,
    }
