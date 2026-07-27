#!/usr/bin/env python3
"""Compare scripted candidate output while tolerating print-statement trailing whitespace."""

from __future__ import annotations

import argparse
import re
from pathlib import Path


def split_output(data: bytes) -> tuple[bytes, int]:
    data = data.replace(b"\r\n", b"\n")
    if len(data) < 91:
        raise ValueError(f"output is only {len(data)} bytes")
    board = data[:91]
    if len(board.splitlines()) != 7 or not board.endswith(b"[==========]\n"):
        raise ValueError("output does not begin with a 7-row board")
    match = re.search(rb"-?\d+", data[91:])
    if not match:
        raise ValueError("score not found")
    return board, int(match.group())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("expected", type=Path)
    parser.add_argument("actual", type=Path)
    args = parser.parse_args()
    expected = split_output(args.expected.read_bytes())
    actual = split_output(args.actual.read_bytes())
    if actual != expected:
        raise SystemExit(f"mismatch: expected score {expected[1]}, got {actual[1]}")


if __name__ == "__main__":
    main()
