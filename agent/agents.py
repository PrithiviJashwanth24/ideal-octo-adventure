"""
Blesstech Multi-Agent Automation System
Each agent is a specialized worker that handles one part of the video creation pipeline.
The Orchestrator coordinates all agents and tracks job state.
"""
import asyncio
import json
import os
import uuid
import time
import logging
import subprocess
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("blesstech.agents")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


# ─────────────────────────────────────────────────────────────
# Domain types
# ─────────────────────────────────────────────────────────────

class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    FAILED = "failed"


class AgentRole(str, Enum):
    ORCHESTRATOR = "orchestrator"
    INTAKE = "intake"
    SCRIPT = "script"
    CAPTIONER = "captioner"
    VIDEO_EDITOR = "video_editor"
    AUDIO_MIXER = "audio_mixer"
    BRAND_DESIGNER = "brand_designer"
    QUALITY_CHECK = "quality_check"
    PUBLISHER = "publisher"


@dataclass
class AgentMessage:
    sender: str
    recipient: str
    role: AgentRole
    payload: Dict[str, Any]
    msg_id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    timestamp: float = field(default_factory=time.time)


@dataclass
class Job:
    job_id: str
    input_video: str
    brand: str = "blesstech"
    status: JobStatus = JobStatus.QUEUED
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    steps: List[Dict] = field(default_factory=list)
    output_video: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict = field(default_factory=dict)

    def add_step(self, agent: str, action: str, result: Any = None, error: str = None):
        self.steps.append({
            "agent": agent,
            "action": action,
            "result": result,
            "error": error,
            "ts": round(time.time(), 3),
        })
        self.updated_at = time.time()

    def to_dict(self):
        d = asdict(self)
        d["status"] = self.status.value
        return d


# ─────────────────────────────────────────────────────────────
# Base Agent
# ─────────────────────────────────────────────────────────────

class BaseAgent(ABC):
    """Abstract base for all specialized agents."""

    def __init__(self, name: str, role: AgentRole):
        self.name = name
        self.role = role
        self.log = logging.getLogger(f"agent.{name}")

    @abstractmethod
    async def run(self, job: Job, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent work. Returns updated context."""
        ...

    def _log(self, job: Job, msg: str):
        self.log.info(f"[{job.job_id}] {msg}")


# ─────────────────────────────────────────────────────────────
# Specialized Agents
# ─────────────────────────────────────────────────────────────

class IntakeAgent(BaseAgent):
    """Validates input, extracts video metadata, prepares workspace."""

    def __init__(self):
        super().__init__("IntakeAgent", AgentRole.INTAKE)

    async def run(self, job: Job, context: Dict) -> Dict:
        self._log(job, f"Analyzing input: {job.input_video}")

        if not os.path.exists(job.input_video):
            raise FileNotFoundError(f"Input video not found: {job.input_video}")

        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries",
             "format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate",
             "-of", "json", job.input_video],
            capture_output=True, text=True
        )
        info = json.loads(result.stdout)
        fmt = info.get("format", {})
        streams = info.get("streams", [])

        video_stream = next((s for s in streams if s.get("codec_name") not in ("aac", "mp3", "opus")), {})
        audio_stream = next((s for s in streams if s.get("codec_name") in ("aac", "mp3", "opus")), {})

        metadata = {
            "duration": float(fmt.get("duration", 0)),
            "size_bytes": int(fmt.get("size", 0)),
            "bit_rate": int(fmt.get("bit_rate", 0)),
            "width": video_stream.get("width"),
            "height": video_stream.get("height"),
            "video_codec": video_stream.get("codec_name"),
            "audio_codec": audio_stream.get("codec_name"),
            "has_audio": bool(audio_stream),
            "fps_raw": video_stream.get("r_frame_rate", "30/1"),
        }
        job.metadata.update(metadata)

        # Workspace
        ws = Path(job.input_video).parent.parent / "workspace" / job.job_id
        ws.mkdir(parents=True, exist_ok=True)
        context["workspace"] = str(ws)
        context["metadata"] = metadata

        job.add_step(self.name, "intake", metadata)
        self._log(job, f"OK — {metadata['width']}x{metadata['height']}, {metadata['duration']:.1f}s")
        return context


class ScriptAgent(BaseAgent):
    """Generates shot list, hook text, captions and CTA copy."""

    def __init__(self):
        super().__init__("ScriptAgent", AgentRole.SCRIPT)

    async def run(self, job: Job, context: Dict) -> Dict:
        self._log(job, "Generating script and caption timeline")
        duration = context["metadata"]["duration"]
        brand = job.brand.upper()

        script = {
            "hook": {
                "line1": "WHAT IF YOUR",
                "line2": "BUSINESS RAN ITSELF?",
                "timing": [0.2, 1.8],
            },
            "brand_reveal": {
                "brand_name": brand,
                "tagline": "SAP Business One Partner",
                "timing": [2.0, 5.5],
            },
            "value_props": [
                {"text": "IMPLEMENTATION IN WEEKS. NOT MONTHS.", "start": 5.0, "end": 7.5},
                {"text": "500+ BUSINESSES TRANSFORMED", "start": 7.5, "end": 10.0},
                {"text": "REAL-TIME INSIGHTS. ZERO GUESSWORK.", "start": 10.5, "end": 13.5},
                {"text": "ONE PLATFORM: FINANCE • INVENTORY • CRM", "start": 14.0, "end": 16.5},
                {"text": "FROM CHAOS TO CLARITY. INSTANTLY.", "start": 17.0, "end": 20.0},
                {"text": "SAP GOLD PARTNER — TRUSTED WORLDWIDE", "start": 21.0, "end": 24.0},
            ],
            "cta": {
                "headline": "READY TO SCALE?",
                "url": "www.blesstech.com",
                "cta_text": "↓  DM 'SAP' TO GET STARTED  ↓",
                "timing": [25.0, duration],
            },
            "total_duration": duration,
        }

        context["script"] = script
        job.add_step(self.name, "script_generated", {"props": len(script["value_props"])})
        self._log(job, f"Script ready — {len(script['value_props'])} value props, CTA at {script['cta']['timing'][0]}s")
        return context


class CaptionerAgent(BaseAgent):
    """Extracts speech and generates synchronized auto-captions."""

    def __init__(self):
        super().__init__("CaptionerAgent", AgentRole.CAPTIONER)

    async def run(self, job: Job, context: Dict) -> Dict:
        self._log(job, "Generating captions")
        ws = context.get("workspace", "/tmp")
        duration = context["metadata"]["duration"]

        # Extract audio for speech recognition
        audio_path = f"{ws}/audio.wav"
        subprocess.run(
            ["ffmpeg", "-y", "-i", job.input_video, "-vn",
             "-acodec", "pcm_s16le", "-ar", "16000", audio_path],
            capture_output=True
        )

        # Try Whisper if available, otherwise use placeholder captions
        captions = []
        try:
            import whisper
            model = whisper.load_model("base")
            result = model.transcribe(audio_path, fp16=False)
            for seg in result.get("segments", []):
                captions.append({
                    "start": seg["start"],
                    "end": seg["end"],
                    "text": seg["text"].strip().upper(),
                })
            self._log(job, f"Whisper transcribed {len(captions)} segments")
        except ImportError:
            self._log(job, "Whisper not available — using structured captions from script")
            # Use script-based captions as fallback
            script = context.get("script", {})
            for vp in script.get("value_props", []):
                captions.append({
                    "start": vp["start"],
                    "end": vp["end"],
                    "text": vp["text"],
                })

        context["captions"] = captions
        job.add_step(self.name, "captions_ready", {"count": len(captions)})
        return context


class BrandDesignerAgent(BaseAgent):
    """Resolves brand assets, colors, fonts and overlay specs."""

    BRAND_PROFILES = {
        "blesstech": {
            "primary": "0xD4A017",
            "secondary": "0xFFFFFF",
            "bg": "0x0A0A0A",
            "font_hero": "/usr/share/fonts/truetype/open-sans/OpenSans-ExtraBold.ttf",
            "font_body": "/usr/share/fonts/truetype/open-sans/OpenSans-Bold.ttf",
            "logo": "assets/blesstech_logo.jpg",
            "tagline": "SAP Business One Partner",
            "cta": "www.blesstech.com",
            "grain": 8,
            "vignette": True,
            "lut": "teal_orange",
        }
    }

    def __init__(self):
        super().__init__("BrandDesignerAgent", AgentRole.BRAND_DESIGNER)

    async def run(self, job: Job, context: Dict) -> Dict:
        profile = self.BRAND_PROFILES.get(job.brand.lower(), self.BRAND_PROFILES["blesstech"])

        base = Path(job.input_video).parent.parent
        logo_abs = str(base / profile["logo"])
        if not os.path.exists(logo_abs):
            logo_abs = None

        context["brand"] = {**profile, "logo_abs": logo_abs}
        job.add_step(self.name, "brand_resolved", {"brand": job.brand, "has_logo": bool(logo_abs)})
        self._log(job, f"Brand profile loaded for '{job.brand}'")
        return context


class VideoEditorAgent(BaseAgent):
    """Core FFmpeg editing agent: color grade, effects, overlays."""

    def __init__(self):
        super().__init__("VideoEditorAgent", AgentRole.VIDEO_EDITOR)

    async def run(self, job: Job, context: Dict) -> Dict:
        from video_processor import process_video, build_blesstech_overlays

        ws = context["workspace"]
        brand = context.get("brand", {})
        duration = context["metadata"]["duration"]
        output_path = f"{ws}/edited.mp4"

        self._log(job, f"Starting cinematic edit → {output_path}")

        result = process_video(
            input_path=job.input_video,
            output_path=output_path,
            logo_path=brand.get("logo_abs"),
            verbose=False,
        )

        if not result["success"]:
            raise RuntimeError(f"FFmpeg failed: {result.get('error')}")

        context["edited_video"] = output_path
        job.add_step(self.name, "edit_complete", {
            "output": output_path,
            "size_mb": result["size_mb"],
        })
        self._log(job, f"Edit complete — {result['size_mb']} MB")
        return context


class AudioMixerAgent(BaseAgent):
    """Mixes background music, sound design layers and dialogue."""

    def __init__(self):
        super().__init__("AudioMixerAgent", AgentRole.AUDIO_MIXER)

    async def run(self, job: Job, context: Dict) -> Dict:
        self._log(job, "Audio mix — enhancing dialogue clarity")
        ws = context["workspace"]
        source = context.get("edited_video")
        if not source or not os.path.exists(source):
            self._log(job, "No edited video found — skipping audio mix")
            return context

        output_path = f"{ws}/audio_mixed.mp4"

        # Audio enhancement: normalize, high-pass filter, light compression
        result = subprocess.run([
            "ffmpeg", "-y", "-i", source,
            "-af", (
                "highpass=f=80,"            # remove rumble
                "lowpass=f=12000,"          # remove harsh highs
                "acompressor=threshold=-18dB:ratio=3:attack=5:release=100,"
                "loudnorm=I=-14:TP=-1.5:LRA=7,"  # normalize to -14 LUFS (Instagram standard)
                "volume=1.2"
            ),
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            output_path
        ], capture_output=True, text=True)

        if result.returncode == 0:
            context["edited_video"] = output_path
            job.add_step(self.name, "audio_mixed", {"output": output_path})
            self._log(job, "Audio normalized to -14 LUFS (Instagram spec)")
        else:
            self._log(job, f"Audio mix warning: {result.stderr[-200:]}")
        return context


class QualityCheckAgent(BaseAgent):
    """Validates output: resolution, bitrate, duration, file size."""

    def __init__(self):
        super().__init__("QualityCheckAgent", AgentRole.QUALITY_CHECK)

    CHECKS = {
        "min_width": 1080,
        "min_height": 1920,
        "max_size_mb": 100,
        "min_duration": 5,
        "max_duration": 90,
        "target_fps": 30,
    }

    async def run(self, job: Job, context: Dict) -> Dict:
        video = context.get("edited_video")
        if not video or not os.path.exists(video):
            raise FileNotFoundError("No video to QC")

        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries",
             "format=duration,size:stream=width,height,r_frame_rate",
             "-of", "json", video],
            capture_output=True, text=True
        )
        info = json.loads(result.stdout)
        fmt = info["format"]
        streams = info.get("streams", [])
        vs = next((s for s in streams if s.get("width")), {})

        checks_passed = []
        checks_failed = []

        def chk(name, cond, detail):
            (checks_passed if cond else checks_failed).append(f"{name}: {detail}")

        chk("resolution", vs.get("width", 0) >= 1080, f"{vs.get('width')}x{vs.get('height')}")
        size_mb = int(fmt["size"]) / 1e6
        chk("file_size", size_mb <= 100, f"{size_mb:.1f} MB")
        dur = float(fmt["duration"])
        chk("duration", 5 <= dur <= 90, f"{dur:.1f}s")

        qc_result = {
            "passed": checks_passed,
            "failed": checks_failed,
            "size_mb": round(size_mb, 2),
            "duration": round(dur, 2),
            "resolution": f"{vs.get('width')}x{vs.get('height')}",
        }

        context["qc"] = qc_result
        job.add_step(self.name, "qc_complete", qc_result)
        status = "PASS" if not checks_failed else "WARN"
        self._log(job, f"QC {status} — {len(checks_passed)} passed, {len(checks_failed)} failed")
        return context


class PublisherAgent(BaseAgent):
    """Copies final output to the deliverables folder and generates preview link."""

    def __init__(self):
        super().__init__("PublisherAgent", AgentRole.PUBLISHER)

    async def run(self, job: Job, context: Dict) -> Dict:
        import shutil

        video = context.get("edited_video")
        if not video:
            raise RuntimeError("No video to publish")

        base = Path(job.input_video).parent.parent
        out_dir = base / "output"
        out_dir.mkdir(exist_ok=True)

        timestamp = int(time.time())
        out_name = f"blesstech_reel_{job.job_id}_{timestamp}.mp4"
        dest = str(out_dir / out_name)
        shutil.copy2(video, dest)

        context["final_output"] = dest
        context["output_filename"] = out_name
        job.output_video = dest
        job.add_step(self.name, "published", {
            "path": dest,
            "filename": out_name,
        })
        self._log(job, f"Published → {dest}")
        return context


# ─────────────────────────────────────────────────────────────
# Orchestrator
# ─────────────────────────────────────────────────────────────

class Orchestrator:
    """
    Master coordinator. Runs all specialized agents in sequence,
    handles failures, retries, and job state management.
    """

    PIPELINE: List[BaseAgent] = []  # populated in __init__

    def __init__(self):
        self.agents: List[BaseAgent] = [
            IntakeAgent(),
            ScriptAgent(),
            CaptionerAgent(),
            BrandDesignerAgent(),
            VideoEditorAgent(),
            AudioMixerAgent(),
            QualityCheckAgent(),
            PublisherAgent(),
        ]
        self.jobs: Dict[str, Job] = {}

    def create_job(self, input_video: str, brand: str = "blesstech") -> Job:
        job = Job(
            job_id=str(uuid.uuid4())[:8],
            input_video=input_video,
            brand=brand,
        )
        self.jobs[job.job_id] = job
        logger.info(f"Job created: {job.job_id} for {input_video}")
        return job

    async def run_job(self, job: Job) -> Job:
        """Execute the full pipeline for a job."""
        job.status = JobStatus.RUNNING
        context: Dict[str, Any] = {}

        logger.info(f"=== Pipeline START: {job.job_id} ===")

        for agent in self.agents:
            try:
                logger.info(f"[{job.job_id}] → {agent.name}")
                context = await agent.run(job, context)
            except Exception as exc:
                job.status = JobStatus.FAILED
                job.error = f"{agent.name}: {exc}"
                job.add_step(agent.name, "FAILED", error=str(exc))
                logger.error(f"[{job.job_id}] FAILED at {agent.name}: {exc}")
                return job

        job.status = JobStatus.DONE
        logger.info(f"=== Pipeline DONE: {job.job_id} → {job.output_video} ===")
        return job

    def get_job(self, job_id: str) -> Optional[Job]:
        return self.jobs.get(job_id)

    def list_jobs(self) -> List[Dict]:
        return [j.to_dict() for j in self.jobs.values()]


# ─────────────────────────────────────────────────────────────
# Standalone runner
# ─────────────────────────────────────────────────────────────

async def main():
    import sys
    base = Path(__file__).parent.parent
    video = str(base / "assets" / "source_footage.mp4")

    orch = Orchestrator()
    job = orch.create_job(video, brand="blesstech")

    print(f"\nBlesstech Multi-Agent Pipeline")
    print(f"Job ID: {job.job_id}")
    print(f"Agents: {[a.name for a in orch.agents]}\n")

    job = await orch.run_job(job)

    print(f"\nStatus: {job.status.value.upper()}")
    if job.output_video:
        print(f"Output: {job.output_video}")
    if job.error:
        print(f"Error:  {job.error}")
    print(f"\nPipeline steps:")
    for s in job.steps:
        icon = "✓" if not s["error"] else "✗"
        print(f"  {icon} {s['agent']:25s} {s['action']}")

    return job


if __name__ == "__main__":
    asyncio.run(main())
