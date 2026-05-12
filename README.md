# Blesstech — Viral Instagram Reel Automation System

A complete multi-agent brand video automation platform for **Blesstech SAP Business One**.

---

## What's Inside

```
├── output/
│   └── blesstech_reel.mp4          # ← READY-TO-POST Instagram Reel (1080×1920, 30fps)
│
├── agent/                          # Multi-Agent Video Automation Engine
│   ├── agents.py                   # 8 specialized AI agents + Orchestrator
│   ├── video_processor.py          # FFmpeg cinematic pipeline
│   ├── main.py                     # FastAPI REST API
│   └── requirements.txt
│
├── wordpress-theme/blesstech/      # WordPress Landing Page Theme
│   ├── style.css                   # Premium dark gold brand design
│   ├── functions.php               # Theme setup, AJAX, CPTs
│   ├── index.php                   # Full landing page template
│   ├── js/main.js                  # Animations, video player, form
│   └── standalone.html             # ← Preview without WordPress
│
├── dashboard/                      # Next.js Management Dashboard
│   └── src/app/page.tsx            # Real-time job monitoring UI
│
├── assets/
│   ├── source_footage.mp4          # Original screen recording
│   └── blesstech_logo.jpg          # Brand logo
│
└── docker-compose.yml              # Full-stack deployment
```

---

## The Reel

**File:** `output/blesstech_reel.mp4`

| Spec | Value |
|------|-------|
| Format | MP4 (H.264) |
| Resolution | 1080 × 1920 (9:16 Instagram) |
| Frame Rate | 30fps |
| Duration | ~31 seconds |
| Size | ~78 MB |
| Color Grade | Teal/Orange Cinematic |
| Effects | Film grain, vignette, color balance, sharpening |

**Hook text overlays (timed):**
- `0.2s` — "WHAT IF YOUR BUSINESS RAN ITSELF?"
- `2.0s` — Brand reveal: **BLESSTECH**
- `5.0s` — "IMPLEMENTATION IN WEEKS. NOT MONTHS."
- `7.5s` — "500+ BUSINESSES TRANSFORMED"
- `10.5s` — "REAL-TIME INSIGHTS. ZERO GUESSWORK."
- `14.0s` — "ONE PLATFORM." + FINANCE · INVENTORY · CRM
- `17.0s` — "FROM CHAOS TO CLARITY. INSTANTLY."
- `21.0s` — "SAP GOLD PARTNER"
- `25.0s` — "READY TO SCALE?" + www.blesstech.com
- `26.0s` — Sticky CTA pill: "DM SAP TO GET STARTED"

---

## Multi-Agent System

8 specialized agents run sequentially, each owning one stage:

| # | Agent | Role |
|---|-------|------|
| 1 | **IntakeAgent** | Validates input, extracts metadata |
| 2 | **ScriptAgent** | Generates shot list & caption timeline |
| 3 | **CaptionerAgent** | Speech-to-text synced captions |
| 4 | **BrandDesignerAgent** | Resolves colors, fonts, logo assets |
| 5 | **VideoEditorAgent** | FFmpeg: grade, effects, overlays |
| 6 | **AudioMixerAgent** | Normalize to -14 LUFS (Instagram spec) |
| 7 | **QualityCheckAgent** | Validates resolution, size, duration |
| 8 | **PublisherAgent** | Copies to output, generates URL |

### Run the pipeline directly
```bash
cd agent
pip3 install -r requirements.txt
python3 agents.py
```

### Start the API server
```bash
cd agent
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## WordPress Theme

Drop `wordpress-theme/blesstech/` into `wp-content/themes/`, activate it.

**Preview without WordPress:**
```bash
cd wordpress-theme/blesstech
python3 -m http.server 8080
# Open http://localhost:8080/standalone.html
```

---

## Next.js Dashboard

```bash
cd dashboard
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
# Open http://localhost:3000
```

---

## Full Stack Docker

```bash
docker-compose up -d
# Agent API   → http://localhost:8000
# Dashboard   → http://localhost:3000
# WordPress   → http://localhost:8080
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Video Processing | FFmpeg 6.1 |
| Agent Orchestrator | Python 3.11 asyncio |
| API Backend | FastAPI + Uvicorn |
| Landing Page | WordPress 6.5 + Custom PHP Theme |
| Dashboard | Next.js 14 + Tailwind CSS |
| Deployment | Docker Compose |
