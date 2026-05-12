"""
Blesstech Cinematic Video Processor
Transforms raw footage into viral Instagram Reels using FFmpeg
Uses -filter_complex_script to avoid escaping issues
"""
import subprocess
import os
import json
import tempfile
from pathlib import Path
from typing import List, Optional, Tuple


FONT_EXTRABOLD = "/usr/share/fonts/truetype/open-sans/OpenSans-ExtraBold.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/open-sans/OpenSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/open-sans/OpenSans-Regular.ttf"

OUTPUT_W = 1080
OUTPUT_H = 1920


def q(s: str) -> str:
    """Single-quote a string for FFmpeg drawtext (escape internal quotes & colons)."""
    # FFmpeg drawtext uses : as option separator, ' for quoting values
    # Escape in this order: backslash first, then colon, then quote
    s = s.replace("\\", "\\\\")
    s = s.replace("'", "’")   # replace typographic apostrophe to avoid escaping issues
    s = s.replace(":", r"\:")
    return f"'{s}'"


def drawtext(
    text: str,
    start: float,
    end: float,
    x: str = "(w-text_w)/2",
    y: str = "(h-text_h)/2",
    size: int = 72,
    color: str = "white",
    font: str = FONT_EXTRABOLD,
    bold: bool = True,
    box: bool = False,
    box_color: str = "black@0.5",
    fade_in: float = 0.15,
    fade_out: float = 0.15,
) -> str:
    # Inside single quotes in FFmpeg filter_complex, commas are literal (no escaping needed)
    fi = fade_in
    fo = fade_out
    alpha = (
        f"if(lt(t,{start}),0,"
        f"if(lt(t,{start+fi}),(t-{start})/{fi},"
        f"if(lt(t,{end-fo}),1,"
        f"if(lt(t,{end}),({end}-t)/{fo},0))))"
    )
    parts = [
        f"text={q(text)}",
        f"fontfile={q(font)}",
        f"fontsize={size}",
        f"fontcolor={color}",
        f"x={x}",
        f"y={y}",
        "borderw=3",
        "bordercolor=black@0.85",
        "shadowcolor=black@0.65",
        "shadowx=2",
        "shadowy=2",
        f"alpha='{alpha}'",
        f"enable='between(t,{start},{end})'",
    ]
    if box:
        parts += ["box=1", f"boxcolor={box_color}", "boxborderw=18"]
    return "drawtext=" + ":".join(parts)


def build_overlay_chain(duration: float) -> str:
    """Build all drawtext filters for the Blesstech reel."""
    gold = "0xD4A017"
    white = "white"

    overlays = [
        # HOOK 0-2s
        drawtext("WHAT IF YOUR",          0.2,  1.0, y="h*0.12", size=80,  color=white, fade_in=0.08, fade_out=0.1),
        drawtext("BUSINESS RAN ITSELF?",  0.5,  1.8, y="h*0.20", size=84,  color=gold,  fade_in=0.08, fade_out=0.1),
        # BRAND 2-5.5s
        drawtext("BLESSTECH",             2.0,  5.5, y="h*0.10", size=110, color=gold,  fade_in=0.2,  fade_out=0.2),
        drawtext("SAP Business One Partner", 2.4, 5.5, y="h*0.20", size=52, color=white, font=FONT_BOLD, fade_in=0.2, fade_out=0.2),
        # VALUE PROPS
        drawtext("IMPLEMENTATION",        5.0,  7.0, y="h*0.12", size=90,  color=white, fade_in=0.1, fade_out=0.1),
        drawtext("IN WEEKS. NOT MONTHS.", 5.3,  7.5, y="h*0.22", size=68,  color=gold,  fade_in=0.1, fade_out=0.1),
        drawtext("500+ BUSINESSES",       7.5, 10.0, y="h*0.12", size=92,  color=gold,  fade_in=0.12, fade_out=0.12),
        drawtext("Transformed with SAP B1", 7.8, 10.0, y="h*0.22", size=54, color=white, font=FONT_BOLD, fade_in=0.12, fade_out=0.12),
        # CURIOSITY 2
        drawtext("REAL-TIME INSIGHTS.",  10.5, 13.0, y="h*0.12", size=84,  color=white, fade_in=0.1, fade_out=0.1),
        drawtext("ZERO GUESSWORK.",      11.0, 13.5, y="h*0.22", size=84,  color=gold,  fade_in=0.1, fade_out=0.1),
        # SOLUTION
        drawtext("ONE PLATFORM.",        14.0, 16.5, y="h*0.12", size=96,  color=gold,  fade_in=0.15, fade_out=0.15),
        drawtext("FINANCE  -  INVENTORY  -  CRM", 14.5, 16.5, y="h*0.22", size=48, color=white, font=FONT_BOLD, fade_in=0.15, fade_out=0.15),
        # CURIOSITY 3
        drawtext("FROM CHAOS",           17.0, 19.5, y="h*0.12", size=100, color=white, fade_in=0.1, fade_out=0.1),
        drawtext("TO CLARITY. INSTANTLY.", 17.3, 20.0, y="h*0.22", size=72, color=gold, fade_in=0.1, fade_out=0.1),
        # CREDIBILITY
        drawtext("SAP GOLD PARTNER",     21.0, 24.0, y="h*0.12", size=80,  color=gold,  fade_in=0.15, fade_out=0.15),
        drawtext("Trusted Across Industries Worldwide", 21.5, 24.0, y="h*0.20", size=48, color=white, font=FONT_BOLD, fade_in=0.15, fade_out=0.15),
        # CTA
        drawtext("READY TO SCALE?",      25.0, 28.5, y="h*0.12", size=100, color=gold,  fade_in=0.2, fade_out=0.2),
        drawtext("www.blesstech.com",    25.5, 29.5, y="h*0.20", size=58,  color=white, font=FONT_BOLD, fade_in=0.2, fade_out=0.2),
        # CTA pill at bottom
        drawtext("DM  SAP  TO GET STARTED", 26.0, duration, y="h*0.875",
                 size=46, color=white, box=True, box_color="0xD4A017@0.92",
                 fade_in=0.2, fade_out=0.3),
    ]
    return ",\n".join(overlays)


def build_filter_script(
    logo_path: Optional[str],
    duration: float,
    target_w: int = OUTPUT_W,
    target_h: int = OUTPUT_H,
) -> str:
    """Build the complete filter_complex script content."""
    lines = []

    # Step 1: Scale & crop to 9:16
    lines.append(
        f"[0:v]scale={target_w}:{target_h}:force_original_aspect_ratio=increase,"
        f"crop={target_w}:{target_h},"
        f"setsar=1[scaled];"
    )

    # Step 2: Colorbalance for teal/orange cinematic grade
    # Teal shadows (boost G+B, reduce R in shadows)
    # Orange highlights (boost R, reduce B in highlights)
    lines.append(
        "[scaled]colorbalance="
        "rs=-0.08:gs=0.04:bs=0.08:"   # shadows: teal shift
        "rm=0.0:gm=0.0:bm=0.0:"       # midtones: neutral
        "rh=0.12:gh=-0.02:bh=-0.12"   # highlights: warm orange
        "[cb];"
    )

    # Step 3: Exposure & contrast
    lines.append(
        "[cb]eq=contrast=1.06:brightness=0.015:saturation=1.18:gamma=1.02[eq];"
    )

    # Step 4: Subtle sharpening
    lines.append("[eq]unsharp=5:5:0.6:3:3:0.0[sharp];")

    # Step 5: Film grain
    lines.append("[sharp]noise=alls=7:allf=t+u[grain];")

    # Step 6: Vignette
    lines.append("[grain]vignette=angle=PI/4:eval=frame[vig];")

    # Step 7: Text overlays
    overlay_chain = build_overlay_chain(duration)
    lines.append(f"[vig]{overlay_chain}[text];")

    # Step 8: Logo overlay
    if logo_path and os.path.exists(logo_path):
        lines.append(f"[1:v]scale=200:-1,format=rgba,colorchannelmixer=aa=0.92[logo];")
        lines.append(
            "[text][logo]overlay=x=24:y=24:"
            f"enable='between(t,1.9,5.6)'[out]"
        )
    else:
        lines.append("[text]copy[out]")

    return "\n".join(lines)


def process_video(
    input_path: str,
    output_path: str,
    logo_path: Optional[str] = None,
    verbose: bool = True,
) -> dict:
    """Run the full cinematic processing pipeline."""
    # Probe input
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "json", input_path],
        capture_output=True, text=True
    )
    info = json.loads(probe.stdout)
    duration = float(info["format"]["duration"])

    filter_script_content = build_filter_script(logo_path, duration)

    # Write filter script to temp file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write(filter_script_content)
        script_path = f.name

    if verbose:
        print("=" * 60)
        print("BLESSTECH CINEMATIC REEL PROCESSOR")
        print("=" * 60)
        print(f"Input:    {input_path}")
        print(f"Output:   {output_path}")
        print(f"Duration: {duration:.2f}s")
        print(f"Target:   {OUTPUT_W}x{OUTPUT_H} @ 30fps")
        print(f"Script:   {script_path}")
        print("Processing (this takes ~1-3 minutes)...")

    inputs = ["-i", input_path]
    if logo_path and os.path.exists(logo_path):
        inputs += ["-i", logo_path]

    cmd = (
        ["ffmpeg", "-y"]
        + inputs
        + ["-filter_complex_script", script_path]
        + ["-map", "[out]", "-map", "0:a"]
        + ["-c:v", "libx264", "-preset", "slow", "-crf", "16"]
        + ["-profile:v", "high", "-level", "4.2"]
        + ["-pix_fmt", "yuv420p"]
        + ["-c:a", "aac", "-b:a", "192k", "-ar", "44100"]
        + ["-r", "30"]
        + ["-movflags", "+faststart"]
        + ["-metadata", "title=Blesstech SAP B1 - Viral Reel"]
        + [output_path]
    )

    stderr_output = []
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    _, stderr = proc.communicate()

    os.unlink(script_path)

    if proc.returncode != 0:
        if verbose:
            print("FFMPEG ERROR:")
            print(stderr[-3000:])
        return {"success": False, "error": stderr[-2000:]}

    size = os.path.getsize(output_path) / (1024 * 1024)
    if verbose:
        print(f"\n✓ Reel ready: {output_path} ({size:.1f} MB)")

    return {
        "success": True,
        "output": output_path,
        "size_mb": round(size, 2),
        "duration": duration,
    }


if __name__ == "__main__":
    import sys
    base = Path(__file__).parent.parent
    inp = str(base / "assets" / "source_footage.mp4")
    out = str(base / "output" / "blesstech_reel.mp4")
    logo = str(base / "assets" / "blesstech_logo.jpg")
    os.makedirs(base / "output", exist_ok=True)

    result = process_video(inp, out, logo_path=logo, verbose=True)
    sys.exit(0 if result["success"] else 1)
