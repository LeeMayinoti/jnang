import uuid
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.app.agents.graph import app as graph_app
from backend.app.agents.nodes import classifier_node, generator_node, grader_node
from backend.app.core.database import init_db

app = FastAPI(
    title="Ju|'hoansi Narrative Agentic Generator (jnang)",
    description="3-Agent narrative pipeline: Generator, Classifier, and Grader",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()


class GenerateRequest(BaseModel):
    theme: Optional[str] = Field(default="sharing honey", description="Seed theme for narrative generator")
    input_story: Optional[str] = Field(default=None, description="Existing story text (if set, skips generation)")
    thread_id: Optional[str] = Field(default=None, description="Optional conversation or thread tracking ID")


class GenerateResponse(BaseModel):
    draft_narrative: str
    motifemes: List[str]
    story_moves: List[str]
    grade_report: Dict[str, Any]
    thread_id: str


class GeneratorRequest(BaseModel):
    theme: str = Field(default="sharing honey")


class GeneratorResponse(BaseModel):
    draft_narrative: str


class ClassifierRequest(BaseModel):
    draft_narrative: str


class ClassifierResponse(BaseModel):
    motifemes: List[str]
    story_moves: List[str]


class GraderRequest(BaseModel):
    draft_narrative: str
    motifemes: Optional[List[str]] = Field(default_factory=list)
    story_moves: Optional[List[str]] = Field(default_factory=list)


class GraderResponse(BaseModel):
    grade_report: Dict[str, Any]


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Ju|'hoansi Narrative Agentic Generator (jnang)",
        "agents": ["Agent 1: Generator", "Agent 2: Classifier", "Agent 3: Grader"],
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/generate", response_model=GenerateResponse)
def generate_story(req: GenerateRequest):
    active_thread_id = req.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": active_thread_id}}

    initial_state = {}
    if req.input_story:
        initial_state["input_story"] = req.input_story
    if req.theme:
        initial_state["theme"] = req.theme

    try:
        final_state = graph_app.invoke(initial_state, config=config)
        return GenerateResponse(
            draft_narrative=final_state.get("draft_narrative", ""),
            motifemes=final_state.get("motifemes", []),
            story_moves=final_state.get("story_moves", []),
            grade_report=final_state.get("grade_report", {}),
            thread_id=active_thread_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/generator", response_model=GeneratorResponse)
def run_generator_agent(req: GeneratorRequest):
    try:
        res = generator_node({"theme": req.theme})
        return GeneratorResponse(draft_narrative=res.get("draft_narrative", ""))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/classifier", response_model=ClassifierResponse)
def run_classifier_agent(req: ClassifierRequest):
    try:
        res = classifier_node({"draft_narrative": req.draft_narrative})
        return ClassifierResponse(
            motifemes=res.get("motifemes", []),
            story_moves=res.get("story_moves", []),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/grader", response_model=GraderResponse)
def run_grader_agent(req: GraderRequest):
    try:
        res = grader_node({
            "draft_narrative": req.draft_narrative,
            "motifemes": req.motifemes or [],
            "story_moves": req.story_moves or [],
        })
        return GraderResponse(grade_report=res.get("grade_report", {}))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

