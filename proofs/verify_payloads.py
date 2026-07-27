#!/usr/bin/env python3
"""Prove that each compressed entry expands to its committed readable payload."""

from __future__ import annotations

import ast
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def literal_bytes(source: bytes, start_marker: bytes, end_marker: bytes) -> bytes:
    start = source.index(start_marker) + len(start_marker)
    end = source.rindex(end_marker)
    value = ast.literal_eval(source[start:end].decode("latin-1"))
    if isinstance(value, str):
        return value.encode("latin-1")
    return value


def py1(candidate: bytes) -> bytes:
    packed = literal_bytes(candidate, b"zlib.decompress(", b",-15)")
    return zlib.decompress(packed, -15)


def py2(candidate: bytes) -> bytes:
    packed = literal_bytes(candidate, b"exec", b".decode('zip')")
    return zlib.decompress(packed)


def py3(candidate: bytes) -> bytes:
    packed = literal_bytes(candidate, b"bytes(", b",'l1'),-15))")
    return zlib.decompress(packed, -15)


pairs = [
    ("scripted-py2", "candidates/scripted/py2/tetris_256.py", "candidates/scripted/py2/readable_292.py", py2),
    ("playable-py1", "candidates/playable/py1/tetris_467.py", "candidates/playable/py1/readable_664.py", py1),
    ("playable-py2", "candidates/playable/py2/tetris_420.py", "candidates/playable/py2/readable_589.py", py2),
    ("playable-py3", "candidates/playable/py3/tetris_445.py", "candidates/playable/py3/readable_582.py", py3),
]
for name, candidate_path, readable_path, unpack in pairs:
    expanded = unpack((ROOT / candidate_path).read_bytes())
    readable = (ROOT / readable_path).read_bytes()
    if expanded != readable:
        raise SystemExit(f"{name}: expanded payload differs from {readable_path}")
    print(f"{name:16} expands to {len(expanded)} bytes exactly")
