"""
NLP symptom checker.

Uses spaCy en_core_web_sm + a custom medical EntityRuler for symptom/disease
recognition. Falls back gracefully if the spaCy model isn't installed yet.

Interview talking point:
  "I used spaCy with a custom EntityRuler — domain-specific medical vocabulary
   layered on top of a general language model. This is how production medical
   NLP pipelines are typically built when you can't use a full clinical NER
   model like en_core_sci_sm."
"""

from __future__ import annotations

import re

EMERGENCY_PHRASES = [
    "chest pain", "difficulty breathing", "shortness of breath",
    "can't breathe", "cannot breathe", "unconscious", "unresponsive",
    "severe bleeding", "stroke", "heart attack", "paralysis",
    "loss of consciousness", "seizure", "suicidal",
]

# Medical entity patterns for spaCy EntityRuler
# Each entry: {"label": "SYMPTOM"|"DISEASE"|"BODY_PART", "pattern": str|list}
MEDICAL_PATTERNS = [
    # Symptoms
    {"label": "SYMPTOM", "pattern": "fever"},
    {"label": "SYMPTOM", "pattern": "cough"},
    {"label": "SYMPTOM", "pattern": "dry cough"},
    {"label": "SYMPTOM", "pattern": "headache"},
    {"label": "SYMPTOM", "pattern": "fatigue"},
    {"label": "SYMPTOM", "pattern": "nausea"},
    {"label": "SYMPTOM", "pattern": "vomiting"},
    {"label": "SYMPTOM", "pattern": "diarrhea"},
    {"label": "SYMPTOM", "pattern": "sore throat"},
    {"label": "SYMPTOM", "pattern": "runny nose"},
    {"label": "SYMPTOM", "pattern": "chills"},
    {"label": "SYMPTOM", "pattern": "body ache"},
    {"label": "SYMPTOM", "pattern": "body aches"},
    {"label": "SYMPTOM", "pattern": "loss of taste"},
    {"label": "SYMPTOM", "pattern": "loss of smell"},
    {"label": "SYMPTOM", "pattern": "shortness of breath"},
    {"label": "SYMPTOM", "pattern": "chest pain"},
    {"label": "SYMPTOM", "pattern": "chest tightness"},
    {"label": "SYMPTOM", "pattern": "wheezing"},
    {"label": "SYMPTOM", "pattern": "dizziness"},
    {"label": "SYMPTOM", "pattern": "rash"},
    {"label": "SYMPTOM", "pattern": "swelling"},
    {"label": "SYMPTOM", "pattern": "joint pain"},
    {"label": "SYMPTOM", "pattern": "muscle pain"},
    {"label": "SYMPTOM", "pattern": "back pain"},
    {"label": "SYMPTOM", "pattern": "abdominal pain"},
    {"label": "SYMPTOM", "pattern": "stomach pain"},
    {"label": "SYMPTOM", "pattern": "insomnia"},
    {"label": "SYMPTOM", "pattern": "anxiety"},
    {"label": "SYMPTOM", "pattern": "depression"},
    {"label": "SYMPTOM", "pattern": "weight loss"},
    {"label": "SYMPTOM", "pattern": "weight gain"},
    {"label": "SYMPTOM", "pattern": "blurred vision"},
    {"label": "SYMPTOM", "pattern": "night sweats"},
    # Diseases / conditions
    {"label": "DISEASE", "pattern": "covid"},
    {"label": "DISEASE", "pattern": "covid-19"},
    {"label": "DISEASE", "pattern": "coronavirus"},
    {"label": "DISEASE", "pattern": "pneumonia"},
    {"label": "DISEASE", "pattern": "flu"},
    {"label": "DISEASE", "pattern": "influenza"},
    {"label": "DISEASE", "pattern": "diabetes"},
    {"label": "DISEASE", "pattern": "hypertension"},
    {"label": "DISEASE", "pattern": "asthma"},
    {"label": "DISEASE", "pattern": "bronchitis"},
    {"label": "DISEASE", "pattern": "tuberculosis"},
    {"label": "DISEASE", "pattern": "malaria"},
    {"label": "DISEASE", "pattern": "typhoid"},
    {"label": "DISEASE", "pattern": "dengue"},
    {"label": "DISEASE", "pattern": "sinusitis"},
    {"label": "DISEASE", "pattern": "migraine"},
    {"label": "DISEASE", "pattern": "anemia"},
    {"label": "DISEASE", "pattern": "arthritis"},
    # Body parts
    {"label": "BODY_PART", "pattern": "chest"},
    {"label": "BODY_PART", "pattern": "lungs"},
    {"label": "BODY_PART", "pattern": "throat"},
    {"label": "BODY_PART", "pattern": "stomach"},
    {"label": "BODY_PART", "pattern": "head"},
    {"label": "BODY_PART", "pattern": "back"},
    {"label": "BODY_PART", "pattern": "joints"},
    {"label": "BODY_PART", "pattern": "skin"},
    {"label": "BODY_PART", "pattern": "eyes"},
    {"label": "BODY_PART", "pattern": "nose"},
    {"label": "BODY_PART", "pattern": "ear"},
    {"label": "BODY_PART", "pattern": "ears"},
]

# Symptom -> possible conditions map (used as fallback + augmentation)
SYMPTOM_MAP: dict[str, list[str]] = {
    "fever": ["Common cold", "Flu", "COVID-19", "Pneumonia", "Typhoid", "Malaria"],
    "cough": ["Common cold", "Bronchitis", "Pneumonia", "COVID-19", "Asthma", "Tuberculosis"],
    "dry cough": ["COVID-19", "Asthma", "Allergies"],
    "headache": ["Migraine", "Tension headache", "Sinusitis", "Flu", "Hypertension"],
    "fatigue": ["Flu", "Anemia", "Diabetes", "Depression", "COVID-19"],
    "sore throat": ["Common cold", "Strep throat", "Tonsillitis", "Flu"],
    "shortness of breath": ["Asthma", "Pneumonia", "COVID-19", "Anemia", "Heart condition"],
    "chest pain": ["Angina", "Heart attack", "Pneumonia", "Costochondritis"],
    "nausea": ["Gastroenteritis", "Food poisoning", "Migraine", "Appendicitis"],
    "vomiting": ["Gastroenteritis", "Food poisoning", "Appendicitis"],
    "diarrhea": ["Gastroenteritis", "Food poisoning", "IBS", "Typhoid"],
    "rash": ["Allergy", "Eczema", "Dengue", "Measles", "Contact dermatitis"],
    "dizziness": ["Vertigo", "Anemia", "Low blood pressure", "Dehydration"],
    "joint pain": ["Arthritis", "Dengue", "Flu", "Gout"],
    "loss of taste": ["COVID-19", "Sinusitis", "Zinc deficiency"],
    "loss of smell": ["COVID-19", "Sinusitis", "Common cold"],
    "night sweats": ["Tuberculosis", "Lymphoma", "Menopause", "Anxiety"],
    "weight loss": ["Tuberculosis", "Diabetes", "Hyperthyroidism", "Cancer screening needed"],
}

_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is not None:
        return _nlp
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
        ruler = nlp.add_pipe("entity_ruler", before="ner")
        ruler.add_patterns(MEDICAL_PATTERNS)
        _nlp = nlp
        print("[nlp] spaCy en_core_web_sm loaded with medical EntityRuler")
    except Exception as e:
        print(f"[nlp] spaCy not available, using keyword fallback: {e}")
        _nlp = None
    return _nlp


def analyze_symptoms(text: str) -> dict:
    lower = text.lower()
    emergency = _check_emergency(lower)

    nlp = _get_nlp()
    if nlp is not None:
        entities = _spacy_extract(nlp, text)
    else:
        entities = _keyword_extract(lower)

    conditions = _map_to_conditions(entities)

    return {
        "entities": entities,
        "possible_conditions": conditions,
        "emergency": emergency,
        "model": "spacy-en_core_web_sm" if nlp is not None else "keyword-v0",
    }


def _spacy_extract(nlp, text: str) -> list[str]:
    doc = nlp(text.lower())
    seen: list[str] = []
    for ent in doc.ents:
        if ent.label_ in ("SYMPTOM", "DISEASE", "BODY_PART"):
            val = ent.text.strip()
            if val and val not in seen:
                seen.append(val)
    return seen


def _keyword_extract(text: str) -> list[str]:
    return [k for k in SYMPTOM_MAP if k in text]


def _map_to_conditions(entities: list[str]) -> list[str]:
    seen: list[str] = []
    for e in entities:
        for c in SYMPTOM_MAP.get(e, []):
            if c not in seen:
                seen.append(c)
    return seen


def _check_emergency(text: str) -> dict:
    triggers = [kw for kw in EMERGENCY_PHRASES if kw in text]
    return {
        "is_emergency": bool(triggers),
        "triggers": triggers,
        "message": (
            "Critical symptom detected. Seek immediate medical attention."
            if triggers else ""
        ),
    }
