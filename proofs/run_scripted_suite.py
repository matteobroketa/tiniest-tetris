#!/usr/bin/env python3
"""Run all scripted fixtures with a selected interpreter and candidate."""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

from validate_scripted_output import split_output

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("candidate")
    parser.add_argument("--interpreter", default="python3")
    args = parser.parse_args()
    candidate = ROOT / args.candidate
    vectors = sorted((ROOT / "proofs/vectors/scripted").glob("*.in"))
    for input_path in vectors:
        result = subprocess.run(
            [args.interpreter, str(candidate)],
            input=input_path.read_bytes(),
            stdout=subprocess.PIPE,
            check=True,
            cwd=ROOT,
        )
        expected = split_output(input_path.with_suffix(".out").read_bytes())
        actual = split_output(result.stdout)
        if actual != expected:
            raise SystemExit(f"{input_path.name}: output mismatch")
    print(f"{candidate.relative_to(ROOT)}: {len(vectors)} scripted vectors passed")


if __name__ == "__main__":
    main()
