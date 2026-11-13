"""
Context Builder Utility
=======================
Fetches supporting context for the Generator node from three sources:
  1. Neo4j — narrative ontology (characters, relations, events)
  2. RAG    — transcribed folktale PDFs for stylistic grounding
  3. Dictionary — sample vocabulary entries for prompt injection
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# Paths (resolved relative to this file's location)
# ---------------------------------------------------------------------------

_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "context" / "data"
_STORIES_DIR = _DATA_DIR / "individual story files"


# ---------------------------------------------------------------------------
# 1. Neo4j context
# ---------------------------------------------------------------------------

def _get_neo4j_session():
    """Returns an active Neo4j session or None if Neo4j is unavailable."""
    from backend.app.core.database import db_conn
    from backend.app.core.config import settings

    if db_conn._driver is None:
        db_conn.connect(settings.NEO4J_URI, settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)
    return db_conn.get_session()


def _fetch_canonical_story_arcs(theme: str, limit: int = 2) -> List[dict]:
    """
    Fetches and chronologically orders canonical :Story move arcs matching `theme`.
    Returns a list of dicts: {id, title, theme, moves: [...]}.
    """
    session = _get_neo4j_session()
    if session is None:
        return []

    tokens = list(_tokenize(theme))
    with session as s:
        stories = s.run(
            """
            MATCH (st:Story {source: 'canonical'})
            OPTIONAL MATCH (st)-[:HAS_MOVE]->(nf:NarrativeFunction)
            WITH st, collect(DISTINCT nf) AS moves
            WITH st, moves,
                 size([t IN $tokens WHERE
                       toLower(coalesce(st.theme, '') + ' ' + coalesce(st.title, '')) CONTAINS t
                       OR any(m IN moves WHERE toLower(coalesce(m.label, '')) CONTAINS t)]) AS score
            RETURN st.id AS id, st.title AS title, st.theme AS theme, score
            ORDER BY score DESC, st.id ASC
            LIMIT $limit
            """,
            tokens=tokens,
            limit=limit,
        ).data()

        arcs = []
        for st in stories:
            moves = s.run(
                """
                MATCH (st:Story {id: $sid})-[:HAS_MOVE]->(nf:NarrativeFunction)
                OPTIONAL MATCH (nf)-[:INSTANTIATES]->(mot:Motifeme)
                OPTIONAL MATCH (nf)-[:OCCURS_AT]->(loc:Location)
                OPTIONAL MATCH (nf)-[:INVOLVES_OBJECT|HAS_MAGICAL_AGENT]->(obj)
                OPTIONAL MATCH (actor)-[:PERFORMS_FUNCTION]->(nf)
                WITH nf, mot,
                     collect(DISTINCT coalesce(loc.label, '') + ' [' + coalesce(loc.domain, 'Liminal') + ']') AS locs,
                     collect(DISTINCT coalesce(loc.domain, 'Liminal')) AS domains,
                     collect(DISTINCT obj.label) AS objs,
                     collect(DISTINCT actor.label) AS actors
                OPTIONAL MATCH (nf)-[:FOLLOWS]->(prev:NarrativeFunction)
                RETURN nf.id AS id, nf.label AS label, mot.id AS motifeme,
                       locs, domains, objs, actors, count(prev) AS has_prev
                ORDER BY nf.id ASC
                """,
                sid=st["id"],
            ).data()

            # (after)-[:FOLLOWS]->(before) in this ontology, so chronological order is before -> after
            next_map = {}
            if moves:
                edges = s.run(
                    """
                    MATCH (st:Story {id: $sid})-[:HAS_MOVE]->(after:NarrativeFunction)-[:FOLLOWS]->(before:NarrativeFunction)
                    RETURN before.id AS prev_id, after.id AS next_id
                    """,
                    sid=st["id"],
                ).data()
                for e in edges:
                    next_map[e["prev_id"]] = e["next_id"]

            by_id = {m["id"]: m for m in moves}
            ordered = []
            roots = [m["id"] for m in moves if m["has_prev"] == 0]
            seen = set()
            cur = roots[0] if roots else (moves[0]["id"] if moves else None)
            while cur and cur not in seen and cur in by_id:
                seen.add(cur)
                ordered.append(by_id[cur])
                cur = next_map.get(cur)
            for m in moves:
                if m["id"] not in seen:
                    ordered.append(m)

            arcs.append({
                "id": st["id"],
                "title": st["title"],
                "theme": st["theme"],
                "score": st.get("score", 0),
                "moves": ordered,
            })

        return arcs


def get_graph_preview(theme: str) -> dict:
    """
    Returns a compact JSON-serializable subgraph preview for the UI constellation
    animation while the pipeline runs.
    """
    try:
        arcs = _fetch_canonical_story_arcs(theme, limit=2)
        if not arcs:
            return {"sources": [], "motifemes": [], "entities": []}

        sources = []
        motifemes = []
        entities = []
        seen_entities = set()
        for arc in arcs:
            compact_moves = []
            for m in arc["moves"][:7]:
                domain = (m.get("domains") or ["Liminal"])[0]
                compact_moves.append({
                    "id": m["id"],
                    "label": m["label"],
                    "motifeme": m.get("motifeme") or "Mediation",
                    "domain": domain,
                })
                if m.get("motifeme"):
                    motifemes.append(m["motifeme"])
                for ent in (m.get("actors") or []) + (m.get("objs") or []):
                    if ent and ent not in seen_entities:
                        seen_entities.add(ent)
                        entities.append(ent)
            sources.append({
                "id": arc["id"],
                "title": arc["title"],
                "moves": compact_moves,
            })

        return {
            "sources": sources,
            "motifemes": motifemes[:8],
            "entities": entities[:8],
        }
    except Exception as e:
        print(f"[ContextBuilder] Graph preview unavailable: {e}")
        return {"sources": [], "motifemes": [], "entities": []}


def get_neo4j_context(theme: str) -> str:
    """
    Queries the Neo4j ontology graph for canonical :Story arcs matching `theme`,
    traversing their FOLLOWS move chains, Dundes :Motifeme tags, Camp/Bush
    :Location domains, and Sydow oicotype entities.
    Returns a formatted string for prompt injection, or "" if Neo4j is unavailable.
    """
    try:
        arcs = _fetch_canonical_story_arcs(theme, limit=2)
        if not arcs:
            return ""

        lines = ["## Ontology Structural Context (Neo4j Canonical Arcs)"]
        for st in arcs:
            lines.append(f"\n### Reference Arc: {st['title']} ({st['id']})")
            ordered = st["moves"]
            motifeme_chain = [m["motifeme"] for m in ordered if m.get("motifeme")]
            if motifeme_chain:
                lines.append("Motifeme pattern: " + " → ".join(motifeme_chain))
            for m in ordered[:8]:
                mot_tag = f"[{m['motifeme']}] " if m.get("motifeme") else ""
                loc_str = ", ".join(l for l in m["locs"] if l.strip(" []"))
                extras = []
                if loc_str:
                    extras.append(f"at {loc_str}")
                if m["actors"]:
                    extras.append("actors: " + ", ".join(m["actors"][:3]))
                if m["objs"]:
                    extras.append("items: " + ", ".join(m["objs"][:3]))
                extra_txt = f" ({'; '.join(extras)})" if extras else ""
                lines.append(f"- {mot_tag}{m['label']}{extra_txt}")

        return "\n".join(lines)

    except Exception as e:
        print(f"[ContextBuilder] Neo4j unavailable: {e}")
        return ""


def get_classifier_graph_context() -> str:
    """
    Retrieves canonical Dundes :Motifeme definitions and sample Ju|'hoansi
    NarrativeFunction moves from Neo4j to ground Agent 2 (Classifier).
    """
    try:
        session = _get_neo4j_session()
        if session is None:
            return ""

        with session as s:
            rows = s.run(
                """
                MATCH (m:Motifeme)
                OPTIONAL MATCH (nf:NarrativeFunction)-[:INSTANTIATES]->(m)
                WHERE nf.id STARTS WITH 'S'
                WITH m, collect(DISTINCT nf.label)[0..2] AS examples
                RETURN m.id AS motifeme, m.description AS description, examples
                ORDER BY m.id
                """
            ).data()

        if not rows:
            return ""

        lines = ["## Canonical Motifeme Grounding (Neo4j)"]
        for r in rows:
            ex = "; ".join(r["examples"]) if r["examples"] else "—"
            lines.append(f"- **{r['motifeme']}**: {r['description']} (e.g. {ex})")
        return "\n".join(lines)

    except Exception as e:
        print(f"[ContextBuilder] Classifier Neo4j context unavailable: {e}")
        return ""


def get_grader_graph_context(motifemes: List[str], draft_narrative: str = "") -> str:
    """
    Retrieves canonical motifeme transition patterns, Camp/Bush spatial
    reference data, and the closest canonical :Story records stored in Neo4j
    to ground Agent 3 (Grader).
    """
    try:
        session = _get_neo4j_session()
        if session is None:
            return ""

        with session as s:
            transitions = s.run(
                """
                MATCH (after:NarrativeFunction)-[:FOLLOWS]->(before:NarrativeFunction),
                      (before)-[:INSTANTIATES]->(m1:Motifeme),
                      (after)-[:INSTANTIATES]->(m2:Motifeme)
                WHERE before.id STARTS WITH 'S' AND after.id STARTS WITH 'S'
                RETURN m1.id AS from_m, m2.id AS to_m, count(*) AS freq
                ORDER BY freq DESC
                LIMIT 15
                """
            ).data()
            camp_bush = s.run(
                """
                MATCH (l:Location)
                WHERE l.domain IS NOT NULL
                RETURN l.domain AS domain, collect(DISTINCT l.label)[0..4] AS samples
                """
            ).data()

        matched_arcs = _fetch_canonical_story_arcs(draft_narrative, limit=2) if draft_narrative else []

        if not transitions and not camp_bush and not matched_arcs:
            return ""

        lines = ["## Canonical Structural Reference (Neo4j)"]
        if transitions:
            trans_str = ", ".join(f"{t['from_m']}→{t['to_m']} ({t['freq']}x)" for t in transitions[:10])
            lines.append(f"Common canonical motifeme transitions: {trans_str}")
        if camp_bush:
            for row in camp_bush:
                lines.append(f"Spatial domain [{row['domain']}]: {', '.join(row['samples'])}")
        if motifemes:
            lines.append(f"Candidate story motifeme chain: {' → '.join(motifemes)}")

        strong_matches = [a for a in matched_arcs if a.get("score", 0) >= 2]
        if strong_matches:
            lines.append("\n## Closest Canonical Folklore Stories in Neo4j")
            for arc in strong_matches:
                chain = " → ".join(m["motifeme"] for m in arc["moves"] if m.get("motifeme"))
                actors = []
                for m in arc["moves"]:
                    for act in (m.get("actors") or []):
                        if act and act not in actors:
                            actors.append(act)
                moves_preview = "; ".join(m["label"] for m in arc["moves"][:6] if m.get("label"))
                lines.append(
                    f"- **{arc['id']}: {arc['title']}** (token overlap={arc['score']}; "
                    f"theme: {arc['theme']}; actors: {', '.join(actors[:5]) or '—'})\n"
                    f"  Canonical chain: {chain}\n"
                    f"  Canonical events: {moves_preview}"
                )

        return "\n".join(lines)

    except Exception as e:
        print(f"[ContextBuilder] Grader Neo4j context unavailable: {e}")
        return ""


# ---------------------------------------------------------------------------
# 2. RAG context — story PDFs (theme-aware selection)
# ---------------------------------------------------------------------------

_STOPWORDS = {
    "the", "a", "an", "and", "of", "in", "on", "at", "to", "with", "for",
    "from", "first", "found", "by", "is", "are", "was", "were",
}


def _tokenize(s: str) -> set:
    """Lowercase, strip to alphanumerics, drop stopwords and very short tokens."""
    import re

    words = re.findall(r"[a-z0-9]+", s.lower())
    return {w for w in words if w not in _STOPWORDS and len(w) > 2}


def _read_pdf_text(pdf_path: Path) -> str:
    import pypdf

    reader = pypdf.PdfReader(str(pdf_path))
    text = ""
    for page in reader.pages:
        text += (page.extract_text() or "") + "\n"
    return text


def select_relevant_stories(theme: str, top_k: int = 2) -> List[Path]:
    """
    Deterministic, non-LLM relevance ranking of the RAG pool against the
    requested theme: title-token overlap weighted 3x, body-token overlap
    weighted 1x (titles are clean text; extracted PDF body text can have
    ligature/OCR artifacts, so it's a weaker signal). Returns only files
    that score > 0 — an irrelevant theme gets no RAG content rather than
    the same fixed stories every time.
    """
    theme_tokens = _tokenize(theme)
    if not theme_tokens:
        return []

    story_files = sorted(_STORIES_DIR.glob("*.pdf"))
    scored: List[tuple] = []
    for pdf_path in story_files:
        title_tokens = _tokenize(pdf_path.stem)
        try:
            body_tokens = _tokenize(_read_pdf_text(pdf_path))
        except Exception as e:
            print(f"[ContextBuilder] Could not read {pdf_path.name}: {e}")
            body_tokens = set()

        score = 3 * len(theme_tokens & title_tokens) + 1 * len(theme_tokens & body_tokens)
        if score > 0:
            scored.append((score, pdf_path))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [path for _, path in scored[:top_k]]


def get_rag_context(theme: str, top_k: int = 2, max_chars_per_story: int = 1500) -> str:
    """
    Returns stylistic reference excerpts from the RAG pool, filtered to the
    stories most relevant to the requested theme. Returns "" if nothing in
    the pool scores above zero relevance for this theme — an honest "no
    grounding available" signal rather than injecting unrelated content.
    """
    try:
        selected = select_relevant_stories(theme, top_k=top_k)
        if not selected:
            return ""

        excerpts: List[str] = []
        for pdf_path in selected:
            try:
                text = _read_pdf_text(pdf_path)
                trimmed = text.strip()[:max_chars_per_story]
                excerpts.append(f"### Story: {pdf_path.stem}\n{trimmed}")
            except Exception as e:
                print(f"[ContextBuilder] Could not read {pdf_path.name}: {e}")

        if not excerpts:
            return ""

        return "## RAG Story Examples (stylistic reference)\n\n" + "\n\n---\n\n".join(excerpts)

    except Exception as e:
        print(f"[ContextBuilder] RAG extraction failed: {e}")
        return ""


# ---------------------------------------------------------------------------
# 3. Dictionary sample vocabulary
# ---------------------------------------------------------------------------

def get_vocabulary_sample(n: int = 20) -> str:
    """
    Returns a formatted sample of n dictionary entries for the generator to
    weave authentic Ju|'hoan words into the story.
    """
    try:
        import pandas as pd

        xls_path = _DATA_DIR / "ju_dictionary.xls"
        if not xls_path.exists():
            return ""

        df = pd.read_excel(str(xls_path))

        # Filter to meaningful entries (nouns, verbs, common words)
        sample = df.dropna(subset=["Entry", "Sense"]).head(n)

        lines = ["## Ju|'hoan Vocabulary Sample (use in story)"]
        for _, row in sample.iterrows():
            entry = str(row.get("Entry", "")).strip()
            searchable = str(row.get("Searchable", "")).strip()
            sense = str(row.get("Sense", "")).strip()
            pos = str(row.get("POS", "N/A")).strip()
            if entry and sense:
                lines.append(f"- **{entry}** ({searchable}, {pos}): {sense}")

        return "\n".join(lines)

    except Exception as e:
        print(f"[ContextBuilder] Dictionary sample failed: {e}")
        return ""


# ---------------------------------------------------------------------------
# 4. Character name cast sampler (avoids repeating G!ara across runs)
# ---------------------------------------------------------------------------

_HUMAN_NAME_POOL = [
    "|'Oma", "Bau", "Dxao", "/Asa", "Kha||'an", "!Xuma", "Dahm",
    "Di||xao", "Tci!xo", "N!aici", "/Kunta", "Kxao", "Toma", "N||hakxa",
    "N!xao", "Kgao",
]
_NAME_BAG: List[str] = []


def get_character_name_cast(k: int = 4) -> str:
    """
    Deals a fresh non-overlapping set of traditional Ju|'hoansi human names
    per run so consecutive stories do not repeat G!ara or share identical casts.
    """
    import random

    global _NAME_BAG
    picks: List[str] = []
    while len(picks) < k:
        if not _NAME_BAG:
            _NAME_BAG = random.sample(_HUMAN_NAME_POOL, k=len(_HUMAN_NAME_POOL))
        cand = _NAME_BAG.pop()
        if cand not in picks:
            picks.append(cand)
    return (
        "## Suggested Human Character Names for This Telling\n"
        f"Pick names from this fresh cast and pair with kin roles: {', '.join(picks)}.\n"
        "Do NOT cast the trickster god G!ara as a generic human hunter or uncle."
    )


# ---------------------------------------------------------------------------
# Combined context builder
# ---------------------------------------------------------------------------

def build_generator_context(theme: str) -> str:
    """
    Assembles the full context block (Neo4j + RAG + vocabulary + cast) to inject
    into the Generator's user prompt.
    """
    parts: List[str] = []

    neo4j_ctx = get_neo4j_context(theme)
    if neo4j_ctx:
        parts.append(neo4j_ctx)

    rag_ctx = get_rag_context(theme)
    if rag_ctx:
        parts.append(rag_ctx)

    vocab_ctx = get_vocabulary_sample()
    if vocab_ctx:
        parts.append(vocab_ctx)

    cast_ctx = get_character_name_cast()
    if cast_ctx:
        parts.append(cast_ctx)

    if not parts:
        return "(No external context available — rely on trained knowledge.)"

    return "\n\n".join(parts)
