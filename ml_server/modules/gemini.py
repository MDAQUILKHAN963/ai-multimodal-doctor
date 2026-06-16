"""
LLM wrappers — explain X-ray results and answer symptom queries.
Uses Groq (free tier, no billing required) with llama-3.3-70b.
"""

from __future__ import annotations

import os
from groq import Groq

_client: Groq | None = None
_MODEL = "llama-3.3-70b-versatile"

_XRAY_FALLBACK = (
    "AI-generated explanation is currently unavailable. "
    "Please consult a qualified doctor to interpret your X-ray result. "
    "This is an AI screening tool for educational purposes only."
)

_SYMPTOM_FALLBACK = (
    "AI-generated response is currently unavailable. "
    "Based on your symptoms, please consult a qualified doctor for proper diagnosis and treatment. "
    "If you are experiencing severe symptoms, seek immediate medical attention."
)


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key or api_key.startswith("your_"):
            raise ValueError(
                "GROQ_API_KEY is not set. "
                "Get a free key at https://console.groq.com and add it to ml_server/.env"
            )
        _client = Groq(api_key=api_key)
    return _client


def explain_xray_result(label: str, confidence: float) -> str:
    pct = round(confidence * 100, 1)
    prompt = f"""You are a compassionate medical assistant helping a patient understand
their chest X-ray AI screening result.

AI detection result: {label}
Confidence score: {pct}%

Write a clear, 3-4 sentence explanation that:
1. Explains what "{label}" means in simple everyday language (no jargon)
2. Explains what a {pct}% confidence score means — is it high or low?
3. Tells the patient what their next step should be

Rules:
- Never say the patient definitely has or doesn't have a condition
- Keep language calm and reassuring, not alarming
- End with: "This is an AI screening tool for educational purposes only — please consult a qualified doctor for proper diagnosis and treatment."
- Keep the total response under 120 words"""

    try:
        response = _get_client().chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.4,
        )
        return response.choices[0].message.content.strip()
    except ValueError as e:
        print(f"[llm] config error: {e}")
        return _XRAY_FALLBACK
    except Exception as e:
        print(f"[llm] xray explanation failed: {e}")
        return _XRAY_FALLBACK


def generate_symptom_response(
    symptoms: str,
    ner_entities: list[str],
    rag_context: list[str] | None = None,
) -> str:
    entities_str = ", ".join(ner_entities) if ner_entities else "none detected"
    context_str = "\n".join(rag_context) if rag_context else "No additional context available."

    prompt = f"""You are a helpful, caring medical assistant having a conversation with a patient.

Patient said: "{symptoms}"
Medical entities detected: {entities_str}
Relevant medical background: {context_str}

Respond in 4-5 sentences:
1. Acknowledge what they're experiencing (empathetic tone)
2. Briefly explain what their symptoms could indicate (2-3 possible conditions)
3. Give one or two practical self-care tips
4. Tell them clearly when they must seek immediate medical attention

Rules:
- Plain conversational English, not clinical language
- Do not diagnose — use "may suggest" or "could indicate"
- End with: "Please consult a qualified doctor for proper diagnosis and treatment."
- Keep response under 150 words"""

    try:
        response = _get_client().chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250,
            temperature=0.4,
        )
        return response.choices[0].message.content.strip()
    except ValueError as e:
        print(f"[llm] config error: {e}")
        return _SYMPTOM_FALLBACK
    except Exception as e:
        print(f"[llm] symptom response failed: {e}")
        return _SYMPTOM_FALLBACK
