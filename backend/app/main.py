from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.app.agents.graph import app as graph_app
from backend.app.core.database import init_db

app = FastAPI(title="Ju|'hoansi Narrative Agentic Generator (jnang)")

@app.on_event("startup")
def startup_event():
    init_db()

class GenerateRequest(BaseModel):
    theme: str
    target_motifeme_skeleton: Optional[List[str]] = Field(default=None)
    max_iterations: Optional[int] = Field(default=3)

class GenerateResponse(BaseModel):
    draft_narrative: str
    motifeme_skeleton: List[str]
    spatial_transitions: List[Dict[str, Any]]
    linguistic_terms: List[str]
    syntactic_score: float
    cultural_score: float
    iteration_count: int
    status: str

@app.get("/")
def read_root():
    return {"message": "jnang backend API is running"}

@app.post("/generate", response_model=GenerateResponse)
def generate_story(req: GenerateRequest):
    initial_state = {
        "theme": req.theme,
        "target_motifeme_skeleton": req.target_motifeme_skeleton,
        "draft_narrative": "",
        "motifeme_skeleton": [],
        "spatial_transitions": [],
        "linguistic_terms": [],
        "critique_report": {},
        "syntactic_score": 0.0,
        "cultural_score": 0.0,
        "iteration_count": 0,
        "max_iterations": req.max_iterations,
        "status": "continue"
    }
    
    try:
        final_state = graph_app.invoke(initial_state)
        return GenerateResponse(
            draft_narrative=final_state.get("draft_narrative", ""),
            motifeme_skeleton=final_state.get("motifeme_skeleton", []),
            spatial_transitions=final_state.get("spatial_transitions", []),
            linguistic_terms=final_state.get("linguistic_terms", []),
            syntactic_score=final_state.get("syntactic_score", 0.0),
            cultural_score=final_state.get("cultural_score", 0.0),
            iteration_count=final_state.get("iteration_count", 0),
            status=final_state.get("status", "failed")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
