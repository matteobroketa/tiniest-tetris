#!/usr/bin/env python3
"""Verify that the GitHub Pages copies are exact and internally complete."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"

READABLE_SOURCES = {
    "assets/candidates/scripted/py1/tetris_308.py": "candidates/scripted/py1/tetris_308.py",
    "assets/candidates/scripted/py2/readable_292.py": "candidates/scripted/py2/readable_292.py",
    "assets/candidates/scripted/py3/tetris_287.py": "candidates/scripted/py3/tetris_287.py",
    "assets/candidates/playable/py1/readable_664.py": "candidates/playable/py1/readable_664.py",
    "assets/candidates/playable/py2/readable_589.py": "candidates/playable/py2/readable_589.py",
    "assets/candidates/playable/py3/readable_582.py": "candidates/playable/py3/readable_582.py",
}

REQUIRED_SITE_FILES = [
    "index.html",
    "styles.css",
    "app.js",
    "python-worker.js",
    "data/candidates.json",
    "data/scripted-sample.in",
    "data/playable-keys.txt",
    "assets/favicon.svg",
    "assets/social-card.png",
    ".nojekyll",
]


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def require(path: Path) -> None:
    if not path.is_file():
        raise SystemExit(f"missing required Pages file: {path.relative_to(ROOT)}")


def main() -> None:
    for relative in REQUIRED_SITE_FILES:
        require(DOCS / relative)

    manifest = json.loads((DOCS / "data/candidates.json").read_text(encoding="utf-8"))
    checked = 0
    for challenge in manifest["challenges"].values():
        for candidate in challenge["versions"].values():
            web_path = DOCS / candidate["candidate"]
            repo_path = ROOT / candidate["repoSource"]
            require(web_path)
            require(repo_path)
            web_bytes = web_path.read_bytes()
            repo_bytes = repo_path.read_bytes()
            if web_bytes != repo_bytes:
                raise SystemExit(f"Pages copy differs from repository artifact: {candidate['candidate']}")
            if len(web_bytes) != candidate["bytes"]:
                raise SystemExit(
                    f"byte mismatch for {candidate['candidate']}: "
                    f"expected {candidate['bytes']}, got {len(web_bytes)}"
                )
            digest = sha256(web_bytes)
            if digest != candidate["sha256"]:
                raise SystemExit(
                    f"SHA-256 mismatch for {candidate['candidate']}: "
                    f"expected {candidate['sha256']}, got {digest}"
                )
            readable = DOCS / candidate["readable"]
            require(readable)
            checked += 1

    for web_relative, repo_relative in READABLE_SOURCES.items():
        web_path = DOCS / web_relative
        repo_path = ROOT / repo_relative
        require(web_path)
        require(repo_path)
        if web_path.read_bytes() != repo_path.read_bytes():
            raise SystemExit(f"Pages readable copy differs from repository source: {web_relative}")

    html = (DOCS / "index.html").read_text(encoding="utf-8")
    for reference in ("styles.css", "app.js", "assets/social-card.png", "manifest.webmanifest"):
        if reference not in html:
            raise SystemExit(f"index.html does not reference {reference}")

    print(f"Pages verification passed: {checked} candidate artifacts and all site assets are consistent")


if __name__ == "__main__":
    main()
