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

def get_neo4j_context(theme: str) -> str:
    """
    Queries the Neo4j ontology graph for characters, relations, and narrative
    events that are relevant to the given theme.
    Returns a formatted string for prompt injection, or an empty string if
    Neo4j is unavailable.
    """
    try:
        from backend.app.core.database import db_conn
        from backend.app.core.config import settings

        if db_conn._driver is None:
            db_conn.connect(settings.NEO4J_URI, settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD)

        session = db_conn.get_session()
        if session is None:
            return ""

        with session as s:
            # Introspect the graph schema to find the actual property key used for node labels
            # (some graphs use rdfs__label, uri, or other keys instead of 'name')
            result = s.run(
                """
                MATCH (n)
                WHERE any(key IN keys(n) WHERE toLower(toString(n[key])) CONTAINS toLower($theme))
                OPTIONAL MATCH (n)-[r]->(m)
                WITH n, r, m, keys(n)[0] AS pk
                RETURN toString(n[pk]) AS entity,
                       type(r) AS relation,
                       CASE WHEN m IS NOT NULL THEN toString(m[keys(m)[0]]) ELSE null END AS target,
                       '' AS description
                LIMIT 20
                """,
                theme=theme,
            )
            rows = result.data()

        if not rows:
            # Broader fallback — pull a sample of any nodes
            with db_conn.get_session() as s:
                result = s.run(
                    """
                    MATCH (n)
                    WHERE size(keys(n)) > 0
                    OPTIONAL MATCH (n)-[r]->(m)
                    WITH n, r, m, keys(n)[0] AS pk
                    RETURN toString(n[pk]) AS entity,
                           type(r) AS relation,
                           CASE WHEN m IS NOT NULL THEN toString(m[keys(m)[0]]) ELSE null END AS target,
                           '' AS description
                    LIMIT 15
                    """
                )
                rows = result.data()

        if not rows:
            return ""

        lines = ["## Ontology Context (Neo4j)"]
        for row in rows:
            entity = row.get("entity", "?")
            relation = row.get("relation")
            target = row.get("target")
            desc = row.get("description", "")
            if relation and target:
                lines.append(f"- {entity} --[{relation}]--> {target}")
            elif desc:
                lines.append(f"- {entity}: {desc}")
            else:
                lines.append(f"- {entity}")
        return "\n".join(lines)

    except Exception as e:
        print(f"[ContextBuilder] Neo4j unavailable: {e}")
        return ""


# ---------------------------------------------------------------------------
# 2. RAG context — story PDFs
# ---------------------------------------------------------------------------

def get_rag_context(max_chars_per_story: int = 1500) -> str:
    """
    Reads the transcribed Ju|'hoansi story PDFs from the 'individual story files'
    directory and returns their text as stylistic reference examples.
    """
    try:
        import pypdf

        story_files = sorted(_STORIES_DIR.glob("*.pdf"))
        if not story_files:
            return ""

        excerpts: List[str] = []
        for pdf_path in story_files:
            try:
                reader = pypdf.PdfReader(str(pdf_path))
                text = ""
                for page in reader.pages:
                    page_text = page.extract_text() or ""
                    text += page_text + "\n"
                # Trim to max_chars_per_story
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
# Combined context builder
# ---------------------------------------------------------------------------

def build_generator_context(theme: str) -> str:
    """
    Assembles the full context block (Neo4j + RAG + vocabulary) to inject
    into the Generator's user prompt.
    """
    parts: List[str] = []

    neo4j_ctx = get_neo4j_context(theme)
    if neo4j_ctx:
        parts.append(neo4j_ctx)

    rag_ctx = get_rag_context()
    if rag_ctx:
        parts.append(rag_ctx)

    vocab_ctx = get_vocabulary_sample()
    if vocab_ctx:
        parts.append(vocab_ctx)

    if not parts:
        return "(No external context available — rely on trained knowledge.)"

    return "\n\n".join(parts)
