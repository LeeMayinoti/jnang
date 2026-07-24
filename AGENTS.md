# AGENTS.md

## Stack

Python 3.12 backend (FastAPI + LangGraph + LangChain + OpenAI). React 18 frontend (Vite 5). Neo4j 5 graph database. Docker Compose orchestrates all three.

## Commands

```bash
# Full stack (Docker)
docker-compose up --build        # backend :8000, frontend :3000, neo4j :7474/:7687

# Backend local dev (run from repo root)
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000

# Tests
pytest backend/tests/

# Frontend local dev
cd frontend && npm install && npm run dev   # :3000, proxies /api → :8000

# Import RDF ontology into Neo4j
python import_rdf.py

# Standalone 3D knowledge-graph visualizer (separate from React app)
python server.py                 # :8080
```

## PYTHONPATH

All Python imports are absolute (`backend.app.agents.graph`). Running locally requires the repo root on `PYTHONPATH` or running from the repo root. The Dockerfile sets `PYTHONPATH=/app`.

## Architecture

3-agent LangGraph pipeline: **Generator → Classifier → Grader**. If the user supplies an existing story, Generator is skipped (input echoed through).

- `backend/app/agents/graph.py` — pipeline wiring
- `backend/app/agents/state.py` — flat `NarrativeState(TypedDict)`, no reducers
- `backend/app/agents/nodes/` — one file per agent (`generator.py`, `classifier.py`, `grader.py`). `critic.py` exists but is **not wired** into the graph.
- `backend/app/agents/prompts/__init__.py` — all prompt templates
- `backend/app/utils/context_builder.py` — assembles Neo4j ontology + RAG PDFs + Ju|'hoan dictionary into agent context

Every agent gracefully degrades with hardcoded mock data when `OPENAI_API_KEY` is absent. The frontend also has a full offline simulation mode.

## Two frontends

1. `frontend/` — React/Vite chat UI (the main app)
2. `index.html` + `script.js` + `styles.css` + `graph_data.js` at repo root — standalone vanilla JS 3D Force Graph visualizer for the knowledge graph. Unrelated to the React app.

## Environment

Copy `backend/.env.template` to `backend/.env` and fill in `OPENAI_API_KEY`, `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`.

## Gotchas

- **Neo4j volume**: `docker-compose.yml` hardcodes an external volume name with a specific SHA hash. On a fresh machine, create the volume first or change the volume config.
- **No CI, no linter config, no pre-commit hooks.**
- **No Python lockfile** — only loose constraints in `requirements.txt`.
- `context/` contains large binaries (PDFs, Excel, Gemini HTML export) checked into git.

## Domain reference

`skills.md` is the authoritative development specification (Dundes motifemes, Propp moves, grading rubric, agent contracts). `research_notes.md` covers theoretical background. Read `skills.md` before modifying agent prompts or grading logic.
