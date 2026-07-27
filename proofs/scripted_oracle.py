#!/usr/bin/env python3
"""Reference model for the 2010 fixed-input Tetris code-golf task."""

from __future__ import annotations

import argparse
from pathlib import Path

SHAPES = b'  !  !  !!. -"!-"-: :-.:..; ;./G'
EMPTY_PREFIX = b'[%11c\n' % 93
FULL_ROW = b'[##########]\n'


def solve(data: bytes) -> bytes:
    if len(data) < 91:
        raise ValueError("input must contain a 91-byte board")
    board = data[:91]
    commands = data[91:].split()
    cells = bytearray(EMPTY_PREFIX * 99 + board)
    for token in commands:
        if len(token) != 2:
            raise ValueError("commands must be two bytes, for example T2")
        piece, column = token
        offsets = SHAPES[piece * 7 % 12 :: 8]
        position = column - 79
        while 33 > max(cells[position + offset + 13] for offset in offsets):
            position += 13
        for offset in offsets:
            cells[position + offset] = 35
        cells = cells.replace(FULL_ROW, b'')
    score = 1060 - 10 * len(cells) // 13
    return bytes(cells[-91:]) + str(score).encode("ascii")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, nargs="?")
    args = parser.parse_args()
    data = args.input.read_bytes() if args.input else __import__("sys").stdin.buffer.read()
    __import__("sys").stdout.buffer.write(solve(data))


if __name__ == "__main__":
    main()
