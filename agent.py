#!/usr/bin/env python3
"""
Submagic AI Agent
-----------------
Uses Claude claude-opus-4-7 with tool use + Playwright to autonomously drive
the Submagic web app: log in, upload videos, monitor processing, and download
finished outputs.

Usage:
    python agent.py --email you@example.com --password secret --video clip.mp4
    python agent.py --url https://app.submagic.co/v/<id>  # open an existing project
    python agent.py --task "Download the last processed video"

Environment:
    ANTHROPIC_API_KEY   — required
    SUBMAGIC_EMAIL      — optional, used when --email is omitted
    SUBMAGIC_PASSWORD   — optional, used when --password is omitted
"""

from __future__ import annotations

import argparse
import base64
import os
import sys
import time
from pathlib import Path
from typing import Optional

import anthropic
from dotenv import load_dotenv
from playwright.sync_api import Download, Page, sync_playwright

load_dotenv()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SUBMAGIC_URL = "https://app.submagic.co"
MODEL = "claude-opus-4-7"
MAX_ITERATIONS = 80


# ---------------------------------------------------------------------------
# Browser helpers
# ---------------------------------------------------------------------------


def screenshot_b64(page: Page) -> str:
    """Return a base64-encoded PNG screenshot of the current page."""
    return base64.standard_b64encode(page.screenshot()).decode()


def image_block(b64: str) -> dict:
    return {
        "type": "image",
        "source": {"type": "base64", "media_type": "image/png", "data": b64},
    }


# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------


TOOLS: list[dict] = [
    {
        "name": "screenshot",
        "description": (
            "Take a screenshot of the browser and return it as an image so you can "
            "see the current state of the page. Call this before deciding what to do."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "click",
        "description": "Click at pixel coordinates (x, y) on the page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "x": {"type": "number", "description": "X pixel coordinate"},
                "y": {"type": "number", "description": "Y pixel coordinate"},
            },
            "required": ["x", "y"],
        },
    },
    {
        "name": "type_text",
        "description": (
            "Type text into the currently focused input. "
            "Click the input element first, then call this."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "Text to type"},
                "clear_first": {
                    "type": "boolean",
                    "description": "Select-all and delete before typing (default false)",
                },
            },
            "required": ["text"],
        },
    },
    {
        "name": "press_key",
        "description": "Press a keyboard key, e.g. Enter, Tab, Escape, ArrowDown.",
        "input_schema": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "Playwright key name"},
            },
            "required": ["key"],
        },
    },
    {
        "name": "navigate",
        "description": "Navigate the browser to a full URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string"},
            },
            "required": ["url"],
        },
    },
    {
        "name": "wait",
        "description": "Pause for up to 30 seconds. Use while waiting for uploads or processing.",
        "input_schema": {
            "type": "object",
            "properties": {
                "seconds": {"type": "number", "description": "How long to wait (max 30)"},
            },
            "required": ["seconds"],
        },
    },
    {
        "name": "upload_file",
        "description": (
            "Set a local file on a <input type='file'> element. "
            "Provide the CSS selector of that input and the local file path."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "CSS selector for the file input (e.g. 'input[type=file]')",
                },
                "file_path": {
                    "type": "string",
                    "description": "Absolute or relative local path of the file to upload",
                },
            },
            "required": ["selector", "file_path"],
        },
    },
    {
        "name": "wait_for_selector",
        "description": "Wait until a CSS selector appears in the DOM (up to timeout_ms).",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {"type": "string"},
                "timeout_ms": {
                    "type": "number",
                    "description": "Timeout in milliseconds (default 30000)",
                },
            },
            "required": ["selector"],
        },
    },
    {
        "name": "get_text",
        "description": "Return the visible text content of the first element matching a CSS selector.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {"type": "string"},
            },
            "required": ["selector"],
        },
    },
    {
        "name": "download_with_click",
        "description": (
            "Click a download button/link and save the resulting file to output_dir. "
            "Returns the saved file path."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "x": {"type": "number"},
                "y": {"type": "number"},
                "output_dir": {
                    "type": "string",
                    "description": "Local directory to save the downloaded file",
                },
            },
            "required": ["x", "y", "output_dir"],
        },
    },
    {
        "name": "scroll",
        "description": "Scroll the page by a given number of pixels.",
        "input_schema": {
            "type": "object",
            "properties": {
                "delta_x": {"type": "number", "description": "Horizontal pixels (default 0)"},
                "delta_y": {"type": "number", "description": "Vertical pixels (positive = down)"},
            },
            "required": ["delta_y"],
        },
    },
    {
        "name": "task_complete",
        "description": "Signal that the task has been completed successfully.",
        "input_schema": {
            "type": "object",
            "properties": {
                "summary": {"type": "string", "description": "What was accomplished"},
            },
            "required": ["summary"],
        },
    },
]


# ---------------------------------------------------------------------------
# Tool execution
# ---------------------------------------------------------------------------


def execute_tool(
    page: Page,
    name: str,
    inp: dict,
    default_video: Optional[str],
    default_output_dir: str,
) -> tuple[str | list, bool]:
    """
    Execute one tool call against the live browser page.

    Returns:
        (content, is_done) — content is the tool-result payload for Claude;
        is_done is True when the agent should stop.
    """
    if name == "screenshot":
        return [image_block(screenshot_b64(page))], False

    if name == "click":
        page.mouse.click(float(inp["x"]), float(inp["y"]))
        time.sleep(0.5)
        return f"Clicked ({inp['x']}, {inp['y']}).", False

    if name == "type_text":
        if inp.get("clear_first"):
            page.keyboard.press("Control+A")
            page.keyboard.press("Delete")
        page.keyboard.type(inp["text"], delay=40)
        return f"Typed {len(inp['text'])} characters.", False

    if name == "press_key":
        page.keyboard.press(inp["key"])
        time.sleep(0.3)
        return f"Pressed {inp['key']}.", False

    if name == "navigate":
        url = inp["url"]
        page.goto(url, wait_until="networkidle", timeout=30_000)
        return f"Navigated to {url}.", False

    if name == "wait":
        secs = min(float(inp["seconds"]), 30)
        time.sleep(secs)
        return f"Waited {secs:.1f}s.", False

    if name == "upload_file":
        file_path = inp.get("file_path") or default_video
        if not file_path:
            return "Error: no file_path provided and no default video configured.", False
        selector = inp["selector"]
        el = page.query_selector(selector)
        if el:
            el.set_input_files(file_path)
            time.sleep(1.0)
            return f"Uploaded '{file_path}' via selector '{selector}'.", False
        return f"Error: file input '{selector}' not found on page.", False

    if name == "wait_for_selector":
        timeout = int(inp.get("timeout_ms", 30_000))
        try:
            page.wait_for_selector(inp["selector"], timeout=timeout)
            return f"Element '{inp['selector']}' appeared.", False
        except Exception as exc:
            return f"Timeout waiting for '{inp['selector']}': {exc}", False

    if name == "get_text":
        el = page.query_selector(inp["selector"])
        if el:
            return el.inner_text().strip(), False
        return f"Element '{inp['selector']}' not found.", False

    if name == "download_with_click":
        out_dir = inp.get("output_dir", default_output_dir)
        Path(out_dir).mkdir(parents=True, exist_ok=True)
        try:
            with page.expect_download(timeout=60_000) as dl_info:
                page.mouse.click(float(inp["x"]), float(inp["y"]))
            dl: Download = dl_info.value
            save_path = Path(out_dir) / dl.suggested_filename
            dl.save_as(str(save_path))
            return f"Saved download to {save_path}.", False
        except Exception as exc:
            return f"Download error: {exc}", False

    if name == "scroll":
        dx = float(inp.get("delta_x", 0))
        dy = float(inp["delta_y"])
        page.mouse.wheel(dx, dy)
        time.sleep(0.3)
        return f"Scrolled ({dx}, {dy}).", False

    if name == "task_complete":
        summary = inp.get("summary", "")
        print(f"\n✅  Task complete: {summary}")
        return "Done.", True

    return f"Unknown tool: {name}", False


# ---------------------------------------------------------------------------
# Agent loop
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are an autonomous browser agent controlling a Chromium browser window.
Your job is to complete tasks on the Submagic video-subtitle web app.

Operating rules:
- Always take a screenshot first to understand what is on screen.
- Read loading spinners, progress bars, and error banners before acting.
- After uploading a video, Submagic may take several minutes to process it.
  Poll with screenshots (wait 15–30 s between checks) rather than giving up.
- When a download button appears for the finished video, use download_with_click.
- If you see a login gate, use the credentials supplied in the task description.
- When the task is complete, call task_complete with a short summary.
- If something goes wrong that you cannot fix, call task_complete and describe the blocker.
"""


def run_agent(
    page: Page,
    task: str,
    video_path: Optional[str] = None,
    output_dir: str = "./outputs",
) -> None:
    """Run the Claude agent loop until the task is done or iterations are exhausted."""
    client = anthropic.Anthropic()

    # Seed the conversation with the current browser state
    messages: list[dict] = [
        {
            "role": "user",
            "content": [
                image_block(screenshot_b64(page)),
                {"type": "text", "text": f"Current browser state. Your task:\n\n{task}"},
            ],
        }
    ]

    for iteration in range(1, MAX_ITERATIONS + 1):
        print(f"[{iteration}/{MAX_ITERATIONS}] → Claude...", end="", flush=True)

        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        print(f" stop={response.stop_reason}")

        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            print("[Agent] Finished — no more tool calls.")
            break

        if response.stop_reason != "tool_use":
            print(f"[Agent] Unexpected stop_reason: {response.stop_reason}")
            break

        tool_results = []
        done = False

        for block in response.content:
            if block.type != "tool_use":
                continue

            print(f"   ↳ {block.name}({_fmt_input(block.input)})")
            content, done = execute_tool(
                page, block.name, block.input, video_path, output_dir
            )
            tool_results.append(
                {"type": "tool_result", "tool_use_id": block.id, "content": content}
            )
            if done:
                break

        messages.append({"role": "user", "content": tool_results})

        if done:
            break
    else:
        print(f"[Agent] Reached max iterations ({MAX_ITERATIONS}).")


def _fmt_input(inp: dict) -> str:
    """Compact single-line representation of tool input for logging."""
    parts = []
    for k, v in inp.items():
        if isinstance(v, str) and len(v) > 60:
            v = v[:57] + "..."
        parts.append(f"{k}={v!r}")
    return ", ".join(parts)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


def build_task(args: argparse.Namespace) -> str:
    if args.task:
        return args.task

    email = args.email or os.getenv("SUBMAGIC_EMAIL", "")
    password = args.password or os.getenv("SUBMAGIC_PASSWORD", "")
    video = args.video

    if email and password and video:
        return (
            f"Log in to Submagic with email '{email}' and password '{password}'. "
            f"Upload the video file located at '{video}'. "
            "Wait for Submagic to finish processing (adding subtitles/captions). "
            f"Then download the finished output video to '{args.output_dir}'."
        )

    if email and password:
        return (
            f"Log in to Submagic with email '{email}' and password '{password}'. "
            "Then show me what projects and videos are available in my dashboard."
        )

    return (
        "Navigate the Submagic application and describe what you see. "
        "If a login page is shown, stop and report that credentials are required."
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Submagic AI Agent — Claude drives your Submagic workflow",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--email", help="Submagic account email (or set SUBMAGIC_EMAIL)")
    parser.add_argument("--password", help="Submagic account password (or set SUBMAGIC_PASSWORD)")
    parser.add_argument("--video", help="Local path to a video file to upload")
    parser.add_argument(
        "--url",
        default=SUBMAGIC_URL,
        help=f"Starting URL (default: {SUBMAGIC_URL})",
    )
    parser.add_argument(
        "--output-dir",
        default="./outputs",
        metavar="DIR",
        help="Directory for downloaded files (default: ./outputs)",
    )
    parser.add_argument(
        "--task",
        help="Override the auto-generated task with a custom natural-language description",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        help="Run Chromium in headless mode (no visible window)",
    )
    args = parser.parse_args()

    if not os.getenv("ANTHROPIC_API_KEY"):
        sys.exit("Error: ANTHROPIC_API_KEY is not set. Add it to .env or export it.")

    task = build_task(args)

    print("=" * 60)
    print("Submagic AI Agent")
    print("=" * 60)
    print(f"Start URL  : {args.url}")
    print(f"Output dir : {args.output_dir}")
    print(f"Headless   : {args.headless}")
    print(f"Task       : {task[:120]}{'…' if len(task) > 120 else ''}")
    print("=" * 60)

    Path(args.output_dir).mkdir(parents=True, exist_ok=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=args.headless,
            args=["--window-size=1280,900"],
        )
        ctx = browser.new_context(
            viewport={"width": 1280, "height": 900},
            # Accept downloads
            accept_downloads=True,
        )
        page = ctx.new_page()

        print(f"\nOpening {args.url} …")
        page.goto(args.url, wait_until="networkidle", timeout=30_000)

        run_agent(
            page,
            task=task,
            video_path=args.video,
            output_dir=args.output_dir,
        )

        print("\nAgent finished. Closing browser.")
        browser.close()


if __name__ == "__main__":
    main()
