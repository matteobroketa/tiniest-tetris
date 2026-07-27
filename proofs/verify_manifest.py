#!/usr/bin/env python3
"""Verify exact source byte counts and SHA-256 digests."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "proofs/manifest.json").read_text())
errors = []
for record in manifest["records"]:
    path = ROOT / record["path"]
    data = path.read_bytes()
    actual = {
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "trailing_newline": data.endswith(b"\n"),
    }
    for field, value in actual.items():
        if value != record[field]:
            errors.append(f"{record['id']}: {field}={value!r}, expected {record[field]!r}")
    print(f"{record['id']:24} {len(data):4} bytes  {actual['sha256']}")
if errors:
    raise SystemExit("manifest verification failed:\n" + "\n".join(errors))
print(f"verified {len(manifest['records'])} files")
