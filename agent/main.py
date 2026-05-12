"""
Blesstech Multi-Agent Video Automation API
FastAPI backend — orchestrates all agents and exposes REST endpoints
"""
import asyncio
import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agents import Orchestrator, JobStatus

BASE_DIR = Path(__file__).parent.parent

app = FastAPI(
    title="Blesstech Video Automation API",
    description="Multi-agent system for creating viral Instagram Reels",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = Orchestrator()

# Serve static output files
output_dir = BASE_DIR / "output"
output_dir.mkdir(exist_ok=True)
app.mount("/output", StaticFiles(directory=str(output_dir)), name="output")


# ── Request/Response models ────────────────────────────────────

class JobCreateRequest(BaseModel):
    brand: str = "blesstech"
    video_filename: Optional[str] = None  # from pre-uploaded assets


class JobResponse(BaseModel):
    job_id: str
    status: str
    message: str


# ── Background task wrapper ────────────────────────────────────

async def _run_pipeline(job_id: str):
    job = orchestrator.get_job(job_id)
    if job:
        await orchestrator.run_job(job)


# ── Endpoints ─────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "Blesstech Multi-Agent Video Automation",
        "version": "1.0.0",
        "agents": [a.name for a in orchestrator.agents],
        "endpoints": ["/jobs", "/jobs/{id}", "/upload", "/output/{filename}"],
    }


@app.post("/jobs/upload", response_model=JobResponse)
async def create_job_from_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    brand: str = "blesstech",
):
    """Upload a video file and kick off the automation pipeline."""
    if not file.filename.lower().endswith((".mp4", ".mov", ".avi", ".mkv")):
        raise HTTPException(400, "Only video files accepted (mp4, mov, avi, mkv)")

    # Save uploaded file
    upload_dir = BASE_DIR / "uploads"
    upload_dir.mkdir(exist_ok=True)
    dest = upload_dir / f"{uuid.uuid4().hex[:8]}_{file.filename}"
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)

    job = orchestrator.create_job(str(dest), brand=brand)
    background_tasks.add_task(_run_pipeline, job.job_id)

    return JobResponse(
        job_id=job.job_id,
        status=job.status.value,
        message=f"Pipeline started with {len(orchestrator.agents)} agents",
    )


@app.post("/jobs/asset", response_model=JobResponse)
async def create_job_from_asset(
    background_tasks: BackgroundTasks,
    req: JobCreateRequest,
):
    """Create a job using a pre-existing asset file."""
    if req.video_filename:
        video_path = str(BASE_DIR / "assets" / req.video_filename)
    else:
        video_path = str(BASE_DIR / "assets" / "source_footage.mp4")

    if not os.path.exists(video_path):
        raise HTTPException(404, f"Asset not found: {video_path}")

    job = orchestrator.create_job(video_path, brand=req.brand)
    background_tasks.add_task(_run_pipeline, job.job_id)

    return JobResponse(
        job_id=job.job_id,
        status=job.status.value,
        message=f"Pipeline started — {len(orchestrator.agents)} agents running",
    )


@app.get("/jobs")
async def list_jobs():
    return {"jobs": orchestrator.list_jobs(), "total": len(orchestrator.jobs)}


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = orchestrator.get_job(job_id)
    if not job:
        raise HTTPException(404, f"Job {job_id} not found")
    return job.to_dict()


@app.get("/jobs/{job_id}/download")
async def download_output(job_id: str):
    job = orchestrator.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if job.status != JobStatus.DONE:
        raise HTTPException(400, f"Job not complete (status: {job.status.value})")
    if not job.output_video or not os.path.exists(job.output_video):
        raise HTTPException(404, "Output video not found")
    return FileResponse(
        job.output_video,
        media_type="video/mp4",
        filename=Path(job.output_video).name,
    )


@app.get("/agents")
async def list_agents():
    return {
        "agents": [
            {"name": a.name, "role": a.role.value}
            for a in orchestrator.agents
        ]
    }


@app.get("/assets")
async def list_assets():
    assets_dir = BASE_DIR / "assets"
    files = [f.name for f in assets_dir.iterdir() if f.is_file()] if assets_dir.exists() else []
    return {"assets": files}


@app.get("/output")
async def list_outputs():
    files = [
        {
            "filename": f.name,
            "size_mb": round(f.stat().st_size / 1e6, 2),
            "url": f"/output/{f.name}",
        }
        for f in sorted(output_dir.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True)
        if f.is_file()
    ]
    return {"outputs": files}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
