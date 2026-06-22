# AI Doctor — Free Deployment Guide

Deploy all 3 services + database for **$0**, with the full X-ray AI working.

| Service | Host | Free tier |
|---------|------|-----------|
| Database | **MongoDB Atlas** | 512 MB cluster |
| ML server (FastAPI + TensorFlow) | **Hugging Face Spaces** | 16 GB RAM, Docker |
| Backend (Node/Express) | **Render** | 512 MB web service |
| Frontend (React) | **Vercel** | unlimited static |

> ⚠️ **Free-tier note:** Render and HF Spaces **sleep when idle**. The first
> request after a sleep takes 30–60 seconds to wake up (a "cold start"). This is
> normal for free hosting.

Deploy in this exact order — each step produces a value the next step needs.

---

## ✅ Code is already deployment-ready
These changes have been made for you:
- Frontend reads the backend URL from `VITE_API_URL` (axios + Socket.IO)
- Backend CORS reads the frontend URL from `CLIENT_URL`
- ML server allows all origins + listens on `$PORT` (7860 for HF)
- ML Dockerfile installs the spaCy model

**Commit and push these first:**
```bash
git add -A
git commit -m "chore: make services configurable for production deployment"
git push origin main
```

---

## STEP 1 — Database: MongoDB Atlas (~10 min)

1. Go to **https://www.mongodb.com/cloud/atlas** → sign up.
2. **Create a free cluster** (M0 Sandbox, any cloud/region).
3. **Database Access** → Add a database user (username + password). Save them.
4. **Network Access** → Add IP → **Allow access from anywhere** (`0.0.0.0/0`).
5. **Database** → **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/aidoctor?retryWrites=true&w=majority
   ```
   Replace `USERNAME`/`PASSWORD`, and add `/aidoctor` (the db name) before the `?`.

**📋 Save this as `MONGO_URI`.**

---

## STEP 2 — ML Server: Hugging Face Spaces (~20 min)

The ML server needs TensorFlow (~2 GB), so it goes on HF Spaces (free 16 GB RAM).

1. Go to **https://huggingface.co** → sign up.
2. **New** → **Space**.
   - Name: `ai-doctor-ml`
   - License: any
   - **SDK: Docker** (important — choose Docker, blank template)
   - Visibility: Public
3. You now have an empty Space repo. You need to put your `ml_server/` contents in it.

**Add the required Space config** — in the Space, create a file `README.md` with this at the very top:
```yaml
---
title: AI Doctor ML
emoji: 🩺
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
---
```

**Upload your ml_server files** (easiest = web UI):
- In the Space → **Files** → **Add file** → **Upload files**
- Upload everything inside your `ml_server/` folder: `main.py`, `Dockerfile`,
  `requirements.txt`, the `modules/` folder, the `knowledge_base/` folder, and
  the `models/` folder.
- **The big model** (`models/xray_classifier.h5`, 223 MB): upload it through the
  same UI — HF automatically handles large files with Git LFS. Also upload
  `models/class_names.json`.

> Do NOT upload your `.env` or `venv/` folder.

**Add your secret** — Space → **Settings** → **Variables and secrets** →
**New secret**:
- Name: `GROQ_API_KEY`  Value: your Groq key (`gsk_...`)

The Space will build automatically (takes ~10–15 min the first time — TensorFlow
is large). When done, your ML URL is:
```
https://YOUR-USERNAME-ai-doctor-ml.hf.space
```
Test it: open `https://YOUR-USERNAME-ai-doctor-ml.hf.space/health` → should return `{"status":"ok"}`.

**📋 Save this URL as `ML_SERVER_URL`.**

---

## STEP 3 — Backend: Render (~10 min)

1. Go to **https://render.com** → sign up with GitHub.
2. **New** → **Web Service** → connect your `ai-multimodal-doctor` repo.
3. Configure:
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
4. **Environment** → add these variables:
   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | (from Step 1) |
   | `ML_SERVER_URL` | (from Step 2, the `.hf.space` URL) |
   | `JWT_SECRET` | any long random string |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | leave blank for now — set in Step 5 |
5. **Create Web Service.** When live, your backend URL is:
   ```
   https://ai-doctor-backend-xxxx.onrender.com
   ```
   Test: open `.../api/health` → should show `{"status":"ok","mongo":"connected"}`.

**📋 Save this URL as your backend URL.**

---

## STEP 4 — Frontend: Vercel (~5 min)

1. Go to **https://vercel.com** → sign up with GitHub.
2. **Add New** → **Project** → import your repo.
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite (auto-detected)
4. **Environment Variables** → add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | your backend URL from Step 3 |
5. **Deploy.** Your live app URL will be:
   ```
   https://ai-doctor-xxxx.vercel.app
   ```

**📋 Save this as `CLIENT_URL`.**

---

## STEP 5 — Connect frontend ↔ backend (final wiring)

The backend needs to allow your Vercel domain (for CORS + Socket.IO).

1. Go back to **Render** → your backend → **Environment**.
2. Set `CLIENT_URL` = your Vercel URL (from Step 4, no trailing slash).
3. Save → Render auto-redeploys.

**Done!** Open your Vercel URL and test:
- Register → Login
- Upload an X-ray (first call wakes the HF Space — wait ~60s)
- Try the Symptom Checker
- Check History + download a PDF

---

## Environment Variables Summary

**Render (backend):**
```
MONGO_URI=mongodb+srv://...
ML_SERVER_URL=https://your-username-ai-doctor-ml.hf.space
JWT_SECRET=some-long-random-string
NODE_ENV=production
CLIENT_URL=https://ai-doctor-xxxx.vercel.app
```

**Hugging Face Space (ML):**
```
GROQ_API_KEY=gsk_...
```

**Vercel (frontend):**
```
VITE_API_URL=https://ai-doctor-backend-xxxx.onrender.com
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| X-ray takes 60s first time | HF Space cold start — normal, only the first request |
| "Network Error" in UI | Check `VITE_API_URL` on Vercel = exact backend URL |
| CORS error in console | Check `CLIENT_URL` on Render = exact Vercel URL (no trailing `/`) |
| Login works but data doesn't save | `MONGO_URI` wrong, or Atlas Network Access not `0.0.0.0/0` |
| AI explanation is the fallback text | `GROQ_API_KEY` missing/wrong on the HF Space |
| Socket/notifications not working | `CLIENT_URL` on Render must match Vercel URL exactly |
| HF Space build fails on model | Re-upload `xray_classifier.h5` via the web UI (LFS) |

---

## Optional: keep free services awake
Free Render/HF sleep after ~15 min idle. To reduce cold starts, use a free uptime
pinger like **UptimeRobot** (https://uptimerobot.com) to ping your backend
`/api/health` and the HF `/health` every 10 minutes. (Optional — not required.)
