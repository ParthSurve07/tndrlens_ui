"""
AI Service — Main FastAPI Application
Dedicated microservice for AI/document processing.
Called only by the NestJS backend (not directly by the browser).
"""
import logging
import os
import json
import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.config import settings
from app.utils.pdf_parser import extract_text_from_pdf
from app.ai.extractor import analyze_tender_text
from app.ai.eligibility import evaluate_eligibility_from_dict, calculate_decision_support_from_dict
from app.ai.vector_db import add_tender_embedding, get_similar_tenders, ensure_vector_table
from app.ai.diff_tracker import generate_amendment_diff
from app.ai.chatbot import ask_tender_chatbot

# ── Structured logging ───────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "msg": "%(message)s"}'
)
logger = logging.getLogger("ai-service")

app = FastAPI(
    title="TenderLens AI Microservice",
    description="AI document analysis, RAG chatbot, eligibility scoring, and vector search",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Internal service — NestJS origin only in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Startup ───────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    logger.info("AI service starting up...")
    try:
        ensure_vector_table()
        logger.info("pgvector table ready")
    except Exception as e:
        logger.warning(f"pgvector setup skipped: {e}")


# ── Health ────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service", "version": "2.0.0"}


# ── Request / Response Models ────────────────────────────────────
class AnalyzeRequest(BaseModel):
    tender_text: str


class CompanyProfileDict(BaseModel):
    company_name: str
    turnover: float
    experience_years: int
    similar_projects_completed: int
    max_project_value: float
    certifications: str
    equipment: str
    manpower_count: int


class EligibilityRequest(BaseModel):
    profile: CompanyProfileDict
    clauses: List[Dict[str, Any]]


class ChatRequest(BaseModel):
    tender_text: str
    message: str


class DiffRequest(BaseModel):
    base_text: str
    amendment_file_path: str


class SimilarRequest(BaseModel):
    tender_id: int
    limit: int = 3


class EmbedRequest(BaseModel):
    tender_id: int
    title: str
    summary: str
    full_text: str


# ── Endpoints ────────────────────────────────────────────────────

@app.post("/analyze")
async def analyze_tender(request: AnalyzeRequest):
    """
    Analyze tender text using Gemini AI.
    Returns full extraction: title, organization, clauses, checklist, risk_profile, etc.
    """
    try:
        logger.info("Running tender analysis...")
        result = analyze_tender_text(request.tender_text)
        logger.info(f"Analysis complete: {result.get('title', 'Unknown')}")
        return result
    except Exception as e:
        logger.error(f"Tender analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    """
    Parse a PDF file and return extracted text.
    Supports text-based PDFs (PyMuPDF) and scanned PDFs (PaddleOCR).
    """
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    file_name = file.filename.replace(" ", "_")
    file_path = os.path.join(upload_dir, file_name)

    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        text = extract_text_from_pdf(file_path)
        logger.info(f"Parsed PDF: {file_name}, chars: {len(text)}")
        return {"file_path": file_path, "text": text, "char_count": len(text)}
    except Exception as e:
        logger.error(f"PDF parse failed: {e}")
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")


@app.post("/eligibility")
def evaluate_eligibility_endpoint(request: EligibilityRequest):
    """
    Evaluate eligibility of company profile against tender clauses.
    Returns score and per-clause evaluation with status (PASS/FAIL/WARN).
    """
    try:
        score, evaluated_clauses = evaluate_eligibility_from_dict(
            request.profile.dict(),
            request.clauses
        )
        return {"score": score, "evaluated_clauses": evaluated_clauses}
    except Exception as e:
        logger.error(f"Eligibility evaluation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/decision-support")
def decision_support_endpoint(
    profile: CompanyProfileDict,
    clauses: List[Dict[str, Any]],
    checklist: List[Dict[str, Any]],
    tender_value: float,
    organization: str
):
    """
    Calculate suitability, bid readiness, Go/No-Go verdict and action plan.
    """
    try:
        metrics = calculate_decision_support_from_dict(
            profile.dict(), clauses, checklist, tender_value, organization
        )
        return metrics
    except Exception as e:
        logger.error(f"Decision support failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    """
    RAG chatbot — answer questions about a tender document.
    """
    try:
        response = ask_tender_chatbot(request.tender_text, request.message)
        return response
    except Exception as e:
        logger.error(f"Chatbot failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/diff")
def diff_endpoint(request: DiffRequest):
    """
    Generate amendment diff between original tender and amendment PDF.
    """
    try:
        summary = generate_amendment_diff(request.base_text, request.amendment_file_path)
        return {"changes_summary": summary}
    except Exception as e:
        logger.error(f"Diff failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/embed")
def embed_tender(request: EmbedRequest):
    """
    Generate and store pgvector embedding for a tender.
    """
    try:
        add_tender_embedding(
            request.tender_id,
            request.title,
            request.summary,
            request.full_text
        )
        return {"status": "ok", "tender_id": request.tender_id}
    except Exception as e:
        logger.error(f"Embed failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/similar/{tender_id}")
def similar_tenders(tender_id: int, limit: int = 3):
    """
    Find similar tenders using pgvector cosine similarity.
    """
    try:
        results = get_similar_tenders(tender_id, limit=limit)
        return results
    except Exception as e:
        logger.error(f"Similar search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
