#!/usr/bin/env python3
"""Generate deterministic scripted-Tetris regression vectors."""

from __future__ import annotations

import argparse
import random
from pathlib import Path

from scripted_oracle import solve

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "vectors" / "scripted"
PIECES = "IJLOSTZ"


def board(rng: random.Random) -> bytes:
    rows = []
    for y in range(6):
        density = 0.0 if y < 2 else 0.06 + 0.05 * (y - 2)
        cells = ["#" if rng.random() < density else " " for _ in range(10)]
        if all(cell == "#" for cell in cells):
            cells[rng.randrange(10)] = " "
        rows.append("[" + "".join(cells) + "]\n")
    rows.append("[==========]\n")
    return "".join(rows).encode("ascii")


def generate() -> dict[str, bytes]:
    rng = random.Random(0x71E715)
    vectors: dict[str, bytes] = {}
    sample = (OUT / "sample.in").read_bytes()
    vectors["sample"] = sample
    index = 0
    while index < 32:
        candidate = board(rng)
        command_count = rng.randint(1, 10)
        commands = [rng.choice(PIECES) + str(rng.randrange(8)) for _ in range(command_count)]
        candidate += (" ".join(commands) + "\n").encode("ascii")
        if len(candidate) - 91 > 99:
            continue
        try:
            solve(candidate)
        except (IndexError, ValueError):
            continue
        vectors[f"case_{index:02d}"] = candidate
        index += 1
    return vectors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    expected = generate()
    mismatches = []
    for name, data in expected.items():
        input_path = OUT / f"{name}.in"
        output_path = OUT / f"{name}.out"
        output = solve(data)
        if args.check:
            if not input_path.exists() or input_path.read_bytes() != data:
                mismatches.append(str(input_path.relative_to(ROOT.parent)))
            if not output_path.exists() or output_path.read_bytes() != output:
                mismatches.append(str(output_path.relative_to(ROOT.parent)))
        else:
            input_path.write_bytes(data)
            output_path.write_bytes(output)
    if args.check and mismatches:
        raise SystemExit("stale generated vectors:\n" + "\n".join(mismatches))
    print(f"scripted vectors: {len(expected)}")


if __name__ == "__main__":
    main()
