from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Any
from dotenv import load_dotenv

from modules.vision import predict_xray
from modules.nlp import analyze_symptoms
from modules.gemini import explain_xray_result, generate_symptom_response
from modules.rag import query_medical_knowledge
from modules.report import generate_report

load_dotenv()

app = FastAPI(title="AI Doctor ML Server", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SymptomRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"status": "ok", "service": "ml_server", "version": "0.3.0"}


@app.post("/predict/xray")
async def predict_xray_endpoint(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    result = predict_xray(image_bytes)

    # Always returns a string — falls back gracefully if key is missing/invalid
    result["gemini_explanation"] = explain_xray_result(
        result["label"], result["confidence"]
    )

    return result


@app.post("/analyze/symptoms")
def analyze_symptoms_endpoint(req: SymptomRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Symptom text cannot be empty")

    result = analyze_symptoms(req.text)

    rag_context = query_medical_knowledge(req.text, k=3)
    result["rag_context"] = rag_context

    # Always returns a string — falls back gracefully if key is missing/invalid
    result["gemini_response"] = generate_symptom_response(
        symptoms=req.text,
        ner_entities=result["entities"],
        rag_context=rag_context if rag_context else None,
    )

    return result


@app.post("/report")
def generate_report_endpoint(scan: dict[str, Any]):
    try:
        pdf_bytes = generate_report(scan)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=ai-doctor-report.pdf"},
        )
    except Exception as e:
        print(f"[report] generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")
