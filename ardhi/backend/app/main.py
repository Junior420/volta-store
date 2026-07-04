"""Ardhi Analytics API — Phase 0.

Run from ardhi/backend:  uvicorn app.main:app --reload
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles

from . import rulepack
from .analysis import analyze
from .report import build_pdf
from .schemas import AnalysisResult, DealInput

app = FastAPI(title="Ardhi Analytics", version="0.1.0",
              description="Real estate finance & investment analysis — Tanzania-first.")

STATIC_DIR = Path(__file__).resolve().parent / "static"


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "ardhi", "version": app.version}


@app.get("/api/rulepack/{jurisdiction}")
def get_rulepack(jurisdiction: str) -> dict:
    try:
        return rulepack.load(jurisdiction)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/analyze", response_model=AnalysisResult)
def analyze_deal(deal: DealInput) -> AnalysisResult:
    try:
        return analyze(deal)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.post("/api/report")
def report(deal: DealInput) -> Response:
    try:
        result = analyze(deal)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    pdf = build_pdf(result)
    filename = f"{deal.name.replace(' ', '_') or 'deal'}_appraisal.pdf"
    return Response(content=pdf, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
