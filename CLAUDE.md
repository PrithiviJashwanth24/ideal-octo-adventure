# Higgsfield CLI

Use the `higgsfield` CLI to generate images and videos from the terminal.

## Auth
```bash
higgsfield auth login        # one-time browser OAuth
higgsfield auth status       # check current session
```

## Discover Models
```bash
higgsfield model list        # full catalog (~30+ models)
```

### Key models to know
| Model | Best for |
|---|---|
| `nano_banana_2` | General images, fast |
| `gpt_image_2` | Infographics, flat design |
| `flux_2` | Photorealistic images |
| `kling3_0` | Image-to-video, cinematic |
| `soul_v2` | Character-consistent video |
| `veo_3_1` | High-fidelity text-to-video |

## Generate Images
```bash
higgsfield generate create nano_banana_2 \
  --prompt "..." \
  --aspect_ratio 16:9 \
  --resolution 2k \
  --wait

higgsfield generate create gpt_image_2 \
  --prompt "..." \
  --aspect_ratio 3:4 \
  --quality high \
  --resolution 2k \
  --wait
```

## Generate Videos
```bash
# Text-to-video
higgsfield generate create veo_3_1 \
  --prompt "..." \
  --duration 5 \
  --wait

# Image-to-video
higgsfield generate create kling3_0 \
  --prompt "..." \
  --start-image ./input.png \
  --duration 5 \
  --mode pro \
  --wait
```

## Check Job Status
```bash
higgsfield generate status <job_id>   # check async job
higgsfield generate list              # list recent jobs
```

## Common Flags
| Flag | Values | Notes |
|---|---|---|
| `--aspect_ratio` | `16:9`, `9:16`, `1:1`, `3:4`, `4:3` | |
| `--resolution` | `1k`, `2k`, `4k` | |
| `--duration` | `5`, `10`, `15` | seconds, video only |
| `--mode` | `standard`, `pro` | video quality |
| `--wait` | — | block until job completes |
| `--output` | `./path/file.png` | save result locally |

## Troubleshooting
- `Session expired` → re-run `higgsfield auth login`
- `Unknown model` → run `higgsfield model list` for current catalog
- Omit `--wait` for async jobs; poll with `higgsfield generate status <job_id>`
