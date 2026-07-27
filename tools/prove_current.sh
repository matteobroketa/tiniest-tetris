#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
python3 proofs/verify_manifest.py
python3 proofs/verify_payloads.py
python3 proofs/generate_scripted_vectors.py --check
python3 proofs/run_scripted_suite.py candidates/scripted/py3/tetris_287.py --interpreter python3
PYTHONPATH=proofs/stubs/py3 TETRIS_KEYS=proofs/vectors/playable_keys.txt PYTHONWARNINGS=ignore \
  python3 candidates/playable/py3/tetris_445.py
PYTHONPATH=proofs/stubs/py3 TETRIS_MODE=random-suite PYTHONWARNINGS=ignore \
  python3 candidates/playable/py3/tetris_445.py
