#!/usr/bin/env python3
"""
Cinematic Instagram Reel Builder
Premium edit: color grade, punch-in zooms at narrative beats,
film grain, vignette, light-leak fade, captions, ambient music
"""
import subprocess, os

INPUT  = "/root/.claude/uploads/c66539b5-0979-4f1a-845d-46bfa397ac70/07fa3f63-VID20260511WA0022.mp4"
DIR    = "/home/user/ideal-octo-adventure/reel"
MUSIC  = f"{DIR}/audio/ambient.wav"
OUTPUT = f"{DIR}/output/reel_cinematic.mp4"
FONT   = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"

os.makedirs(f"{DIR}/audio",    exist_ok=True)
os.makedirs(f"{DIR}/output",   exist_ok=True)
os.makedirs(f"{DIR}/captions", exist_ok=True)

def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        print("STDERR:", r.stderr[-3000:])
        raise SystemExit(1)
    return r

# ── 1. BACKGROUND MUSIC ────────────────────────────────────────────────────────
print("[1/4] Generating cinematic ambient pad (Am7)...")
# Am7 chord: A1=55 A2=110 C3=130.81 E3=164.81 G3=196 A3=220
PAD = (
    "0.10*sin(2*PI*55*t)*(1-exp(-0.3*t))*exp(-0.025*max(0,t-18))"
    "+0.08*sin(2*PI*110*t)*(1-exp(-0.4*t))*exp(-0.025*max(0,t-18))"
    "+0.06*sin(2*PI*130.81*t)*(1-exp(-0.5*t))*exp(-0.025*max(0,t-18))"
    "+0.055*sin(2*PI*164.81*t)*(1-exp(-0.6*t))*exp(-0.025*max(0,t-18))"
    "+0.04*sin(2*PI*196*t)*(1-exp(-0.7*t))*exp(-0.025*max(0,t-18))"
    "+0.03*sin(2*PI*220*t)*(1-exp(-0.9*t))*exp(-0.025*max(0,t-18))"
    "+0.02*sin(2*PI*261.63*t)*(1-exp(-1.1*t))*exp(-0.025*max(0,t-18))"
    "+0.008*sin(2*PI*659.25*t)*(1-exp(-2*t))*exp(-0.04*max(0,t-16))"
)
run([
    "ffmpeg", "-y", "-f", "lavfi",
    "-i", f"aevalsrc='{PAD}':c=stereo:s=44100:d=22",
    "-af", (
        "aecho=0.7:0.75:700:0.22,"
        "equalizer=f=80:t=o:w=40:g=6,"
        "equalizer=f=12000:t=o:w=4000:g=-5,"
        "volume=0.3"
    ),
    MUSIC
], timeout=60)
print(f"   → {MUSIC}")

# ── 2. CAPTION TEXT FILES ──────────────────────────────────────────────────────
print("[2/4] Writing caption files...")

# (start, end, text, color)  color: WHITE | GOLD | RED
captions = [
    # Pattern interrupt — top of frame, red, first 0.85s
    (0.00, 0.85,  "WAIT.",                           "RED",   True),
    # Hook captions
    (0.00, 1.94,  "BEFORE YOU INVEST",               "WHITE", False),
    (1.94, 3.10,  "IN ANOTHER SOFTWARE TOOL",        "WHITE", False),
    (3.46, 4.20,  "ASK YOURSELF THIS",               "WHITE", False),
    (4.20, 5.18,  "ONE QUESTION.",                   "GOLD",  False),
    # Body (name card handles 5.48-7.40, captions resume at 7.74)
    (7.74, 8.60,  "FOR A DECADE",                    "WHITE", False),
    (8.60, 9.84,  "I'VE HELPED COMPANIES",           "WHITE", False),
    (10.18, 10.72, "NOT JUST AN ERP...",             "WHITE", False),
    # Value proposition
    (10.72, 12.96, "BUT A BUSINESS SOLUTION",        "GOLD",  False),
    (12.96, 14.72, "TO THEIR REAL PROBLEM",          "WHITE", False),
    # Key question — three curiosity moments
    (15.10, 16.18, "IS THIS ACTUALLY...",            "WHITE", False),
    (16.18, 17.56, "SOLVING A BUSINESS PROBLEM?",    "GOLD",  False),
    (17.56, 18.40, "OR JUST ADDING",                 "WHITE", False),
    (18.40, 19.88, "A DASHBOARD?",                   "RED",   False),
]

COLORS = {"WHITE": "0xFFFFFF", "GOLD": "0xFFD700", "RED": "0xFF4444"}

cap_files = []
for i, row in enumerate(captions):
    s, e, txt, col, is_top = row
    p = f"{DIR}/captions/cap_{i:02d}.txt"
    with open(p, "w") as f:
        f.write(txt)
    cap_files.append((s, e, p, col, is_top))

with open(f"{DIR}/captions/name.txt",  "w") as f: f.write("SALONI")
with open(f"{DIR}/captions/brand.txt", "w") as f: f.write("FOUNDER  |  BLASTEC")

# ── 3. BUILD FILTER COMPLEX ────────────────────────────────────────────────────
print("[3/4] Building filter complex...")

def drawtext(s, e, path, col_key, size, x, y, box=True):
    col = COLORS[col_key]
    b   = ":box=1:boxcolor=0x000000@0.42:boxborderw=14" if box else ""
    return (
        f"drawtext=fontfile='{FONT}'"
        f":textfile='{path}'"
        f":fontcolor={col}"
        f":fontsize={size}"
        f":x={x}:y={y}"
        f":shadowcolor=0x000000@0.95:shadowx=3:shadowy=3"
        f"{b}"
        f":enable='between(t,{s},{e})'"
    )

# --- Zoom levels at narrative beats via trim+scale+crop+concat ---
# Seg 1 (0-5.48s)   : 1.00x → wide hook
# Seg 2 (5.48-10.72s): 1.06x → slight punch-in for intro
# Seg 3 (10.72-15.10s): 1.10x → medium close for value prop
# Seg 4 (15.10-21.24s): 1.16x → tight close-up for key question
#
# Scale formula: sw=round_even(1080*factor), sh=round_even(1920*factor)
# Crop:          x_off=(sw-1080)//2,  y_off=(sh-1920)//2
SEG = [
    (0,     5.48,  1.00, 1080, 1920,   0,   0),
    (5.48, 10.72,  1.06, 1146, 2036,  33,  58),
    (10.72, 15.10, 1.10, 1188, 2112,  54,  96),
    (15.10, 21.24, 1.16, 1252, 2226,  86, 153),
]

seg_filters = []
seg_labels  = []
for i, (t0, t1, _factor, sw, sh, cx, cy) in enumerate(SEG):
    lbl = f"v{i}"
    crop = f",crop=1080:1920:{cx}:{cy}" if cx > 0 else ""
    seg_filters.append(
        f"[0:v]trim={t0}:{t1},setpts=PTS-STARTPTS,"
        f"scale={sw}:{sh}:flags=lanczos{crop}[{lbl}]"
    )
    seg_labels.append(f"[{lbl}]")

concat_part = ";".join(seg_filters)
concat_part += f";{''.join(seg_labels)}concat=n={len(SEG)}:v=1:a=0[v_zoom]"

# --- Color grade: cinematic teal-orange (lift shadows→teal, push highs→warm) ---
GRADE = (
    "eq=brightness=0.04:contrast=1.13:saturation=1.45:gamma=1.02,"
    "curves="
    "r='0/0 0.25/0.28 0.65/0.72 1/1.0':"
    "g='0/0 0.25/0.23 0.65/0.68 1/0.91':"
    "b='0/0.04 0.25/0.33 0.65/0.64 1/0.82'"
)

# --- Caption drawtext chain ---
cap_chain = []
for s, e, path, col, is_top in cap_files:
    if is_top:
        # Pattern interrupt: large, red, top center, no box
        cap_chain.append(drawtext(s, e, path, col, 100, "(w-text_w)/2", "h*0.11", box=False))
    else:
        cap_chain.append(drawtext(s, e, path, col, 72, "(w-text_w)/2", "h*0.76-text_h/2"))

# Name card lower-third at intro (5.48-7.40s)
cap_chain.append(drawtext(5.48, 7.40, f"{DIR}/captions/name.txt",  "WHITE", 58, "60", "h*0.82"))
cap_chain.append(drawtext(5.48, 7.40, f"{DIR}/captions/brand.txt", "GOLD",  32, "60", "h*0.82+68", box=False))

cap_str = ",".join(cap_chain)

# --- Full video filter ---
VF = (
    f"{concat_part};"
    f"[v_zoom]"
    f"deshake=x=0:y=0:w=1080:h=1920:rx=16:ry=16,"
    f"{GRADE},"
    f"vignette=PI/3.5,"
    f"noise=alls=7:allf=t+u,"
    f"fade=t=in:st=0:d=0.5:color=0xFFC060,"  # warm golden light-leak open
    f"fade=t=out:st=20.2:d=1.0,"
    f"{cap_str}"
    f"[v_out]"
)

FC = VF

# ── 4. RENDER ──────────────────────────────────────────────────────────────────
V_ONLY = f"{DIR}/output/video_only.mp4"
A_ONLY = f"{DIR}/output/audio_mix.m4a"

print(f"   Filter complex: {len(FC)} chars")
print("[4a/4] Rendering video track (colour grade + captions)...")
run([
    "ffmpeg", "-y",
    "-i", INPUT,
    "-filter_complex", FC,
    "-map", "[v_out]",
    "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
    "-pix_fmt", "yuv420p",
    V_ONLY
], timeout=600)

print("[4b/4] Mixing audio (voice EQ + ambient pad)...")
run([
    "ffmpeg", "-y",
    "-i", INPUT,
    "-i", MUSIC,
    "-filter_complex", (
        "[0:a]acompressor=threshold=0.12:ratio=3:attack=5:release=80,"
        "equalizer=f=180:t=o:w=100:g=-3,"
        "equalizer=f=3500:t=o:w=1500:g=3,"
        "equalizer=f=9000:t=o:w=3000:g=2,"
        "volume=1.15,aresample=48000[a_voice];"
        "[1:a]aresample=48000,volume=0.16[a_music];"
        "[a_voice][a_music]amix=inputs=2:duration=first[a_out]"
    ),
    "-map", "[a_out]",
    "-vn",
    "-c:a", "aac", "-b:a", "192k",
    A_ONLY
], timeout=120)

print("[4c/4] Muxing video + audio → final reel...")
run([
    "ffmpeg", "-y",
    "-i", V_ONLY,
    "-i", A_ONLY,
    "-c", "copy",
    "-movflags", "+faststart",
    "-shortest",
    OUTPUT
], timeout=60)

sz = os.path.getsize(OUTPUT) / (1024 * 1024)
print(f"\n✓  Done!  {OUTPUT}  ({sz:.1f} MB)")
print(f"   Resolution : 1080×1920  (9:16 Instagram Reels)")
print(f"   Duration   : ~21s")
print(f"   Color grade: Cinematic teal-orange")
print(f"   Zoom levels: 4 progressive punch-ins at narrative beats")
print(f"   Captions   : 14 timed caption blocks + name lower-third")
print(f"   Audio      : Voice EQ/comp + Am7 ambient pad")
