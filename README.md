# AI Doctor — Multimodal Medical AI Assistant

An AI healthcare assistant that analyzes X-rays (ResNet-50 + Grad-CAM), understands typed symptoms (spaCy NER + LangChain RAG), explains results in plain language (Gemini API), and stores everything in a full MERN web app.

> **Educational use only — not medical advice.**

## Stack

| Layer       | Tech                                                        | Port |
| ----------- | ----------------------------------------------------------- | ---- |
| Frontend    | React 18 + Vite + Tailwind CSS                              | 5173 |
| Backend     | Node.js + Express + MongoDB Atlas                           | 5000 |
| ML Server   | FastAPI + PyTorch (ResNet-50) + spaCy + LangChain + Gemini  | 8000 |

## Quick start

```bash
# 1. ML Server
cd ml_server
python -m venv venv
.\venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Backend (new terminal)
cd backend
npm install
npm run dev

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment variables

Copy `.env.example` to `.env` in each of `backend/` and `ml_server/` and fill in:

- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `GEMINI_API_KEY` — from https://aistudio.google.com
- `ML_SERVER_URL` — defaults to `http://localhost:8000`

## Project structure

```
ai_doctor/
├── frontend/      React + Vite + Tailwind
├── backend/       Node.js + Express API gateway
├── ml_server/     FastAPI + PyTorch + spaCy + LangChain + Gemini
├── training/      Model training scripts and notebooks
└── docker-compose.yml
```

## Status

- [x] Week 1 — Folder structure + hello-world end-to-end ping
- [ ] Week 2 — JWT auth + ResNet-50 training + Grad-CAM
- [ ] Week 3 — FastAPI ML server + React upload UI (real model)
- [ ] Week 4 — NLP symptom checker (spaCy NER)
- [ ] Week 5 — Gemini API integration
- [ ] Week 6 — RAG (LangChain + FAISS)
- [ ] Week 7 — Dashboard + PDF reports
- [ ] Week 8 — Docker + deploy (Vercel + Railway + HuggingFace)
